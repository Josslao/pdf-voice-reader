// TTS 厂商统一抽象层
// 支持 OpenAI / Azure / MiniMax / 火山引擎 / ElevenLabs

import type { ProviderMeta, TTSOptions, TTSProvider, Voice } from "../types";

const OPENAI_VOICES: Voice[] = [
  { id: "alloy", label: "Alloy 中性", gender: "neutral", description: "通用平衡音色" },
  { id: "echo", label: "Echo 男声", gender: "male", description: "稳健男声" },
  { id: "fable", label: "Fable 中性", gender: "neutral", description: "英国风格中性" },
  { id: "onyx", label: "Onyx 男声", gender: "male", description: "深沉男声" },
  { id: "nova", label: "Nova 女声", gender: "female", description: "温暖女声" },
  { id: "shimmer", label: "Shimmer 女声", gender: "female", description: "清亮女声" },
];

const AZURE_VOICES: Voice[] = [
  { id: "zh-CN-XiaoxiaoNeural", label: "晓晓 女声", gender: "female", description: "温暖亲切" },
  { id: "zh-CN-YunxiNeural", label: "云希 男声", gender: "male", description: "成熟稳重" },
  { id: "zh-CN-YunyangNeural", label: "云扬 男声", gender: "male", description: "新闻播音" },
  { id: "zh-CN-XiaoyiNeural", label: "晓伊 女声", gender: "female", description: "活泼青春" },
  { id: "zh-CN-XiaohanNeural", label: "晓涵 女声", gender: "female", description: "端庄大气" },
  { id: "en-US-JennyNeural", label: "Jenny 女声", gender: "female", description: "美式女声" },
  { id: "en-US-GuyNeural", label: "Guy 男声", gender: "male", description: "美式男声" },
];

const MINIMAX_VOICES: Voice[] = [
  { id: "male-qn-qingse", label: "青涩 男声", gender: "male", description: "青年清亮" },
  { id: "male-qn-jingying", label: "精英 男声", gender: "male", description: "成熟专业" },
  { id: "male-qn-badao", label: "霸道 男声", gender: "male", description: "磁性沉稳" },
  { id: "female-shaonv", label: "少女 女声", gender: "female", description: "甜美清新" },
  { id: "female-yujie", label: "御姐 女声", gender: "female", description: "知性成熟" },
  { id: "female-chengshu", label: "成熟 女声", gender: "female", description: "温柔稳重" },
  { id: "presenter_male", label: "主持 男声", gender: "male", description: "广播播音" },
  { id: "presenter_female", label: "主持 女声", gender: "female", description: "广播播音" },
];

const VOLC_VOICES: Voice[] = [
  { id: "zh_female_wanwanxiong_moon_bigtts", label: "弯弯熊 女声", gender: "female", description: "亲切活泼" },
  { id: "zh_male_M392_conversation_wvae_bigtts", label: "灿灿 男声", gender: "male", description: "通用男声" },
  { id: "zh_female_wanwanxiaoyue_moon_bigtts", label: "婉婉小月 女声", gender: "female", description: "甜美抒情" },
  { id: "zh_male_M392_conversation_wvae_bigtts", label: "擎苍 男声", gender: "male", description: "浑厚磁性" },
  { id: "zh_female_linjialin_moon_bigtts", label: "林家林 女声", gender: "female", description: "标准普通话" },
  { id: "zh_male_shaoer_mars_bigtts", label: "少儿 男声", gender: "male", description: "童声朗读" },
];

const ELEVEN_VOICES: Voice[] = [
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel 女声", gender: "female", description: "温柔美国女声" },
  { id: "AZnzlk1XvdvUeBnXldFa", label: "Domi 女声", gender: "female", description: "坚定年轻女声" },
  { id: "ErXw4uOrN4wnJVkpv6Z7", label: "Antoni 男声", gender: "male", description: "醇厚男声" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella 女声", gender: "female", description: "柔和女声" },
  { id: "TxGEqnHWrfWFTfGW9XjX", label: "Josh 男声", gender: "male", description: "深沉年轻男声" },
  { id: "VR6AewLTigWN4dSOhoth", label: "Arnold 男声", gender: "male", description: "沉稳男声" },
];

const PROVIDER_META: Record<string, ProviderMeta> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    description: "GPT 系列同源 TTS,类真人自然音色,支持浏览器跨域调用",
    voices: OPENAI_VOICES,
    keyPrefix: "sk-",
    keyPlaceholder: "sk-...",
    keyHint: "前往 platform.openai.com/api-keys 创建",
  },
  azure: {
    id: "azure",
    label: "Azure",
    description: "微软 Azure 神经语音,支持 100+ 语言",
    voices: AZURE_VOICES,
    needsRegion: true,
    keyPlaceholder: "Azure 资源密钥",
    keyHint: "在 Azure 门户创建 Speech 资源后获取",
  },
  minimax: {
    id: "minimax",
    label: "MiniMax",
    description: "海螺 AI 同源语音,情感丰富(需 GroupId,可能需配 CORS 代理)",
    voices: MINIMAX_VOICES,
    needsGroupId: true,
    keyPlaceholder: "MiniMax API Key",
    keyHint: "在 platform.minimaxi.com 账户信息中获取",
  },
  volc: {
    id: "volc",
    label: "火山引擎",
    description: "字节跳动语音合成",
    voices: VOLC_VOICES,
    keyPlaceholder: "APP_ID:ACCESS_TOKEN",
    keyHint: "格式: APP_ID:ACCESS_TOKEN,在火山引擎控制台获取",
  },
  elevenlabs: {
    id: "elevenlabs",
    label: "ElevenLabs",
    description: "业界最自然的多语种 TTS,支持浏览器跨域调用",
    voices: ELEVEN_VOICES,
    keyPlaceholder: "ElevenLabs API Key",
    keyHint: "前往 elevenlabs.io/api-key 获取",
  },
};

// 统一的 fetch 包装,捕获 CORS / 网络 / HTTP 三类错误
async function safeFetch(
  url: string,
  init: RequestInit,
  providerLabel: string
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    // 浏览器跨域或网络层错误:fetch 抛 TypeError,没有 response
    if (e instanceof TypeError) {
      throw new Error(
        `${providerLabel} 网络请求失败,可能原因:\n` +
          `1. CORS 跨域被拦截(该厂商不允许浏览器直接调用)\n` +
          `2. 网络不通 / 防火墙拦截\n` +
          `建议:换用支持浏览器调用的厂商(OpenAI / ElevenLabs),或使用本地代理。`
      );
    }
    throw new Error(`${providerLabel} 请求异常: ${e instanceof Error ? e.message : String(e)}`);
  }
  return res;
}

// ========== 各厂商实现 ==========

class OpenAITTS implements TTSProvider {
  meta = PROVIDER_META.openai;
  async synthesize(
    text: string,
    voiceId: string,
    options: TTSOptions,
    credentials: { apiKey: string }
  ): Promise<Blob> {
    const res = await safeFetch(
      "https://api.openai.com/v1/audio/speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.apiKey}`,
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: voiceId,
          response_format: options.format ?? "mp3",
          speed: options.speed,
        }),
      },
      "OpenAI"
    );
    if (!res.ok) throw new Error(`OpenAI TTS 失败: ${await formatErr(res)}`);
    return await res.blob();
  }
}

class AzureTTS implements TTSProvider {
  meta = PROVIDER_META.azure;
  async synthesize(
    text: string,
    voiceId: string,
    options: TTSOptions,
    credentials: { apiKey: string; region?: string }
  ): Promise<Blob> {
    const region = credentials.region || "eastus";
    const res = await safeFetch(
      `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": credentials.apiKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "PDFVoice/1.0",
        },
        body: `<speak version='1.0' xml:lang='zh-CN'>
          <voice name='${voiceId}'>
            <prosody rate='${Math.round((options.speed - 1) * 100)}%'>
              ${escapeXml(text)}
            </prosody>
          </voice>
        </speak>`,
      },
      "Azure"
    );
    if (!res.ok) throw new Error(`Azure TTS 失败: ${await formatErr(res)}`);
    return await res.blob();
  }
}

class MiniMaxTTS implements TTSProvider {
  meta = PROVIDER_META.minimax;
  async synthesize(
    text: string,
    voiceId: string,
    options: TTSOptions,
    credentials: { apiKey: string; groupId?: string }
  ): Promise<Blob> {
    const groupId = credentials.groupId?.trim();
    if (!groupId) {
      throw new Error(
        "MiniMax 需要 GroupId。请到 platform.minimaxi.com → 账户管理 → 找到「GroupId」,复制后在设置中填入。"
      );
    }
    const res = await safeFetch(
      `https://api.minimax.chat/v1/t2a_v2?GroupId=${encodeURIComponent(groupId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.apiKey}`,
        },
        body: JSON.stringify({
          model: "speech-01-hd",
          text,
          voice_setting: {
            voice_id: voiceId,
            speed: options.speed,
            vol: 1.0,
            pitch: 0,
          },
          audio_setting: {
            sample_rate: 32000,
            bitrate: 128000,
            format: "mp3",
            channel: 1,
          },
        }),
      },
      "MiniMax"
    );
    if (!res.ok) throw new Error(`MiniMax TTS 失败: ${await formatErr(res)}`);
    // MiniMax 返回 JSON,音频字段为 base64
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const json = (await res.json()) as {
        data?: { audio?: string; hex?: string };
        base_resp?: { status_code?: number; status_msg?: string };
        extra_info?: unknown;
      };
      const status = json.base_resp?.status_code;
      const statusMsg = json.base_resp?.status_msg;
      // MiniMax 业务错误:status_code 非 0,或 status_msg 包含错误关键词
      if ((status !== undefined && status !== 0) || (statusMsg && !statusMsg.includes("success"))) {
        throw new Error(
          `MiniMax 业务错误 ${status ?? "?"}: ${statusMsg ?? "未知"}\n` +
            `完整响应: ${JSON.stringify(json).slice(0, 500)}`
        );
      }
      // 兼容 hex(以 0x 开头,MiniMax t2a_v2 默认)和 base64 两种格式
      const audio = json?.data?.audio ?? json?.data?.hex;
      if (!audio) {
        throw new Error(
          `MiniMax 返回数据中没有音频字段。完整响应:\n` +
            `${JSON.stringify(json).slice(0, 500)}`
        );
      }
      // 智能识别格式:hex 字符只包含 0-9a-fA-F 且以 0x 开头,否则按 base64 处理
      const isHex = audio.startsWith("0x") || /^[0-9a-fA-F]+$/.test(audio);
      const bytes = isHex ? hexToBytes(audio) : base64ToBytes(audio);
      if (bytes.length === 0) {
        throw new Error(
          `MiniMax 返回的音频数据解码后为空。原始字段前 100 字符: ${audio.slice(0, 100)}`
        );
      }
      return new Blob([bytes], { type: "audio/mp3" });
    }
    // 直接二进制
    return await res.blob();
  }
}

class VolcTTS implements TTSProvider {
  meta = PROVIDER_META.volc;
  async synthesize(
    text: string,
    voiceId: string,
    options: TTSOptions,
    credentials: { apiKey: string }
  ): Promise<Blob> {
    const [appId, token] = credentials.apiKey.split(":");
    if (!appId || !token) {
      throw new Error("火山引擎 API Key 格式应为 APP_ID:ACCESS_TOKEN");
    }
    const body = {
      app: { appid: appId, token, cluster: "volcano_tts" },
      user: { uid: "pdfvoice_user" },
      audio: {
        voice_type: voiceId,
        encoding: "mp3",
        speed_ratio: options.speed,
        volume_ratio: 1.0,
        pitch_ratio: 1.0,
      },
      request: {
        reqid: `${Date.now()}${Math.floor(Math.random() * 1e6)}`,
        text,
        text_type: "plain",
        operation: "query",
      },
    };
    const res = await safeFetch(
      "https://openspeech.bytedance.com/api/v1/tts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Resource-Id": "volc.tts",
        },
        body: JSON.stringify(body),
      },
      "火山引擎"
    );
    if (!res.ok) throw new Error(`火山引擎 TTS 失败: ${await formatErr(res)}`);
    const json = (await res.json()) as { data?: string; code?: number; message?: string };
    if (json.code && json.code !== 3000) {
      throw new Error(`火山引擎错误: ${json.message ?? json.code}`);
    }
    const audio = json?.data;
    if (!audio) throw new Error("火山引擎返回数据中没有音频字段");
    const bytes = base64ToBytes(audio);
    return new Blob([bytes], { type: "audio/mp3" });
  }
}

class ElevenLabsTTS implements TTSProvider {
  meta = PROVIDER_META.elevenlabs;
  async synthesize(
    text: string,
    voiceId: string,
    options: TTSOptions,
    credentials: { apiKey: string }
  ): Promise<Blob> {
    const res = await safeFetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": credentials.apiKey,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
            speed: options.speed,
          },
        }),
      },
      "ElevenLabs"
    );
    if (!res.ok) throw new Error(`ElevenLabs TTS 失败: ${await formatErr(res)}`);
    return await res.blob();
  }
}

const PROVIDERS: Record<string, TTSProvider> = {
  openai: new OpenAITTS(),
  azure: new AzureTTS(),
  minimax: new MiniMaxTTS(),
  volc: new VolcTTS(),
  elevenlabs: new ElevenLabsTTS(),
};

export function getProvider(id: string): TTSProvider {
  const p = PROVIDERS[id];
  if (!p) throw new Error(`未知的厂商: ${id}`);
  return p;
}

export function getAllProviders(): TTSProvider[] {
  return Object.values(PROVIDERS);
}

export function getProviderMeta(id: string): ProviderMeta {
  return getProvider(id).meta;
}

async function formatErr(res: Response): Promise<string> {
  let msg = `${res.status} ${res.statusText}`;
  try {
    const t = await res.text();
    if (t) msg = `${msg} - ${t.slice(0, 500)}`;
  } catch {
    /* ignore */
  }
  return msg;
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
