// 音频播放管理:分段调用 TTS,顺序播放,段落高亮
import { useCallback, useEffect, useRef } from "react";
import { useStore, selectReadable } from "../lib/store";
import { getProvider } from "../lib/tts";

const MAX_TTS_CHARS = 1800; // 多数 TTS 厂商单次合成上限约 2000~5000 字符

// 将段落切分为不超过上限的片段
function chunkText(text: string, max = MAX_TTS_CHARS): string[] {
  if (text.length <= max) return [text];
  const sentences = text.split(/(?<=[。!?\.!?])\s*/);
  const chunks: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if ((cur + s).length > max) {
      if (cur) chunks.push(cur);
      // 单句超长则硬切
      if (s.length > max) {
        for (let i = 0; i < s.length; i += max) {
          chunks.push(s.slice(i, i + max));
        }
        cur = "";
      } else {
        cur = s;
      }
    } else {
      cur += s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<{ paraIdx: number; chunkIdx: number; chunks: string[] }[] | null>(null);
  const currentJobRef = useRef(0); // 用于取消旧任务
  // 保存最新的 playNextChunk 引用,避免 Audio 事件监听器闭包过期
  const playNextChunkRef = useRef<() => void>(() => {});

  const parsed = useStore((s) => s.parsed);
  const settings = useStore((s) => s.settings);
  const setCurrentIndex = useStore((s) => s.setCurrentIndex);
  const setPlayState = useStore((s) => s.setPlayState);
  const setError = useStore((s) => s.setError);
  const currentIndex = useStore((s) => s.currentIndex);
  const playState = useStore((s) => s.playState);

  // 初始化 Audio 元素 - 仅挂载一次
  useEffect(() => {
    const audio = new Audio();
    // 不设置 crossOrigin:对 blob URL 不需要,且可能引起 CORS 误报
    audioRef.current = audio;

    const onEnded = () => playNextChunkRef.current();
    const onError = () => {
      const err = audio.error;
      let msg = "音频播放错误";
      if (err) {
        // MediaError.code: 1=ABORTED, 2=NETWORK, 3=DECODE, 4=SRC_NOT_SUPPORTED
        const codeMap: Record<number, string> = {
          1: "加载被中断",
          2: "网络错误",
          3: "解码失败(音频数据格式可能不正确)",
          4: "音频格式不支持或源不可用",
        };
        msg = `音频播放错误 (code ${err.code}): ${codeMap[err.code] ?? "未知"}`;
        if (err.message) msg += ` - ${err.message}`;
      }
      setPlayState("error");
      setError(msg);
    };
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readable = selectReadable(parsed);

  const stop = useCallback(() => {
    currentJobRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    queueRef.current = null;
    setPlayState("idle");
    setCurrentIndex(-1);
  }, [setPlayState, setCurrentIndex]);

  const synthesizeAndPlay = useCallback(
    async (paraIdx: number, chunkIdx: number, chunks: string[]) => {
      const job = ++currentJobRef.current;
      const provider = getProvider(settings.default_provider);
      const apiKey = settings.api_keys[settings.default_provider];
      const region = settings.regions[settings.default_provider];
      const groupId = settings.group_ids[settings.default_provider];
      if (!apiKey) {
        setPlayState("error");
        setError(
          `${provider.meta.label} 未配置 API Key,请打开右上角设置添加。`
        );
        return;
      }
      if (provider.meta.needsGroupId && !groupId) {
        setPlayState("error");
        setError(
          `${provider.meta.label} 需要 GroupId。请打开右上角设置,在 API Key 管理中填入 GroupId。`
        );
        return;
      }
      setPlayState("loading");
      try {
        const blob = await provider.synthesize(chunks[chunkIdx], settings.default_voice, {
          speed: settings.default_speed,
          format: "mp3",
        }, { apiKey, region, groupId });
        if (job !== currentJobRef.current) return; // 已被新任务取代
        // 检查 blob 是否有效
        if (!blob || blob.size === 0) {
          throw new Error(
            `${provider.meta.label} 返回了空的音频数据 (size=${blob?.size ?? 0}, type=${blob?.type ?? "unknown"})`
          );
        }
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.src) URL.revokeObjectURL(audio.src);
        // 强制 mime type,避免某些厂商返回 application/octet-stream 导致浏览器拒绝解码
        const typedBlob = blob.type.startsWith("audio/")
          ? blob
          : new Blob([blob], { type: "audio/mp3" });
        audio.src = URL.createObjectURL(typedBlob);
        await audio.play().catch((e) => {
          console.warn("play() 被阻止或失败:", e);
        });
        setPlayState("playing");
      } catch (e) {
        if (job !== currentJobRef.current) return;
        setPlayState("error");
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [settings, setPlayState, setError]
  );

  const playNextChunk = useCallback(() => {
    const q = queueRef.current;
    if (!q || q.length === 0) {
      setPlayState("idle");
      return;
    }
    const head = q[0];
    const next = head.chunkIdx + 1;
    if (next < head.chunks.length) {
      queueRef.current = [{ ...head, chunkIdx: next }, ...q.slice(1)];
      synthesizeAndPlay(head.paraIdx, next, head.chunks);
      return;
    }
    // 当前段落播完,移到下一段
    const rest = q.slice(1);
    queueRef.current = rest;
    if (rest.length === 0) {
      setPlayState("idle");
      setCurrentIndex(-1);
      return;
    }
    const nextHead = rest[0];
    setCurrentIndex(nextHead.paraIdx);
    synthesizeAndPlay(nextHead.paraIdx, nextHead.chunkIdx, nextHead.chunks);
  }, [synthesizeAndPlay, setPlayState, setCurrentIndex]);

  // 始终保持最新引用
  playNextChunkRef.current = playNextChunk;

  const play = useCallback(
    (startIdx?: number) => {
      if (readable.length === 0) {
        setError("没有可朗读的内容");
        return;
      }
      const start = startIdx ?? (currentIndex >= 0 ? currentIndex : 0);
      // 构建队列:从 start 开始的每一段,切成 chunks
      const queue: { paraIdx: number; chunkIdx: number; chunks: string[] }[] = [];
      for (let i = start; i < readable.length; i++) {
        const chunks = chunkText(readable[i].text);
        queue.push({ paraIdx: i, chunkIdx: 0, chunks });
      }
      if (queue.length === 0) {
        setError("没有可朗读的内容");
        return;
      }
      queueRef.current = queue;
      setCurrentIndex(queue[0].paraIdx);
      synthesizeAndPlay(
        queue[0].paraIdx,
        queue[0].chunkIdx,
        queue[0].chunks
      );
    },
    [readable, currentIndex, synthesizeAndPlay, setCurrentIndex, setError]
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setPlayState("paused");
    }
  }, [setPlayState]);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.src) {
      audio.play().catch(() => {});
      setPlayState("playing");
    } else if (queueRef.current && queueRef.current.length > 0) {
      const head = queueRef.current[0];
      synthesizeAndPlay(head.paraIdx, head.chunkIdx, head.chunks);
    } else {
      play();
    }
  }, [play, synthesizeAndPlay, setPlayState]);

  const next = useCallback(() => {
    const q = queueRef.current;
    if (!q || q.length === 0) return;
    const rest = q.slice(1);
    queueRef.current = rest;
    if (rest.length === 0) {
      setPlayState("idle");
      setCurrentIndex(-1);
      return;
    }
    const head = rest[0];
    setCurrentIndex(head.paraIdx);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    synthesizeAndPlay(head.paraIdx, head.chunkIdx, head.chunks);
  }, [synthesizeAndPlay, setPlayState, setCurrentIndex]);

  const prev = useCallback(() => {
    if (currentIndex <= 0) return;
    const start = currentIndex - 1;
    // 重新构建队列(简单可靠)
    const queue: { paraIdx: number; chunkIdx: number; chunks: string[] }[] = [];
    for (let i = start; i < readable.length; i++) {
      queue.push({ paraIdx: i, chunkIdx: 0, chunks: chunkText(readable[i].text) });
    }
    queueRef.current = queue;
    if (audioRef.current) audioRef.current.pause();
    setCurrentIndex(queue[0].paraIdx);
    synthesizeAndPlay(queue[0].paraIdx, 0, queue[0].chunks);
  }, [currentIndex, readable, synthesizeAndPlay, setCurrentIndex]);

  const playOne = useCallback(
    (paraIdx: number) => {
      const para = readable[paraIdx];
      if (!para) return;
      const chunks = chunkText(para.text);
      queueRef.current = [{ paraIdx, chunkIdx: 0, chunks }];
      if (audioRef.current) audioRef.current.pause();
      setCurrentIndex(paraIdx);
      synthesizeAndPlay(paraIdx, 0, chunks);
    },
    [readable, synthesizeAndPlay, setCurrentIndex]
  );

  return {
    play,
    pause,
    resume,
    next,
    prev,
    stop,
    playOne,
    playState,
    currentIndex,
    readable,
  };
}
