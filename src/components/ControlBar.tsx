import { Loader2, Pause, Play, SkipBack, SkipForward, Square } from "lucide-react";
import type { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useStore } from "@/lib/store";

interface ControlBarProps {
  player: ReturnType<typeof useAudioPlayer>;
}

export default function ControlBar({ player }: ControlBarProps) {
  const parsed = useStore((s) => s.parsed);
  const error = useStore((s) => s.error);
  const { playState, currentIndex, readable } = player;
  const isIdle = playState === "idle";
  const isLoading = playState === "loading";
  const isPlaying = playState === "playing";
  const isPaused = playState === "paused";

  const total = readable.length;
  const canControl = parsed && total > 0;

  return (
    <div className="sticky bottom-0 z-20">
      <div className="mx-auto max-w-[980px] px-5 pb-5">
        <div className="glass rounded-apple-lg border border-black/[0.06] shadow-elevated px-4 py-3">
          {/* 进度条 */}
          <div className="mb-2.5 flex items-center gap-3">
            <span className="text-footnote text-ink-muted tabular-nums w-12 text-right">
              {currentIndex >= 0 ? currentIndex + 1 : 0}
            </span>
            <div className="relative flex-1">
              <div className="h-1 overflow-hidden rounded-full bg-paper-subtle">
                <div
                  className="h-full bg-accent transition-all duration-300-apple ease-apple"
                  style={{
                    width: total > 0 ? `${((currentIndex + 1) / total) * 100}%` : "0%",
                  }}
                />
              </div>
            </div>
            <span className="text-footnote text-ink-muted tabular-nums w-12">
              {total}
            </span>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              className="btn-icon"
              disabled={!canControl || currentIndex <= 0}
              onClick={player.prev}
              aria-label="上一段"
            >
              <SkipBack className="h-5 w-5" strokeWidth={1.75} />
            </button>

            {(isIdle || isPaused) && (
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-elevated transition-all duration-200-apple ease-apple hover:bg-accent-hover active:scale-95 disabled:opacity-40"
                disabled={!canControl}
                onClick={() => (isPaused ? player.resume() : player.play())}
                aria-label={isPaused ? "继续" : "播放"}
              >
                <Play className="h-6 w-6 ml-0.5" strokeWidth={2} fill="currentColor" />
              </button>
            )}

            {isPlaying && (
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink text-white shadow-elevated transition-all duration-200-apple ease-apple hover:bg-ink-soft active:scale-95"
                onClick={player.pause}
                aria-label="暂停"
              >
                <Pause className="h-6 w-6" strokeWidth={2} fill="currentColor" />
              </button>
            )}

            {isLoading && (
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent shadow-soft"
                disabled
                aria-label="合成中"
              >
                <Loader2 className="h-6 w-6 animate-spin" strokeWidth={2} />
              </button>
            )}

            <button
              type="button"
              className="btn-icon"
              disabled={!canControl || currentIndex >= total - 1}
              onClick={player.next}
              aria-label="下一段"
            >
              <SkipForward className="h-5 w-5" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              className="btn-icon ml-2"
              disabled={isIdle || isLoading}
              onClick={player.stop}
              aria-label="停止"
            >
              <Square className="h-4 w-4" strokeWidth={1.75} fill="currentColor" />
            </button>
          </div>

          {error && (
            <div className="mt-2 max-h-32 overflow-y-auto scrollbar-apple whitespace-pre-wrap break-words rounded-apple bg-danger/10 px-3 py-2 text-left text-footnote text-danger">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
