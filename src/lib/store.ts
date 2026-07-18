// 全局状态管理:设置、PDF 解析结果、播放状态

import { create } from "zustand";
import type {
  ParsedPdf,
  ProviderId,
  Settings,
  Paragraph,
} from "./types";

const STORAGE_KEY = "pdfvoice.settings";

const DEFAULT_SETTINGS: Settings = {
  default_provider: "openai",
  default_voice: "nova",
  default_speed: 1.0,
  api_keys: {},
  regions: { azure: "eastus" },
  group_ids: {},
  filter_rules: {
    skip_toc: true,
    skip_footnotes: true,
    skip_annotations: true,
    skip_header_footer: true,
    skip_references: true,
    skip_copyright: true,
  },
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      filter_rules: {
        ...DEFAULT_SETTINGS.filter_rules,
        ...(parsed.filter_rules ?? {}),
      },
      api_keys: { ...parsed.api_keys },
      regions: { ...DEFAULT_SETTINGS.regions, ...parsed.regions },
      group_ids: { ...parsed.group_ids },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* 忽略隐私模式异常 */
  }
}

type PlayState = "idle" | "loading" | "playing" | "paused" | "error";

interface AppState {
  settings: Settings;
  parsed: ParsedPdf | null;
  parsing: boolean;
  parseProgress: { loaded: number; total: number } | null;

  // 播放状态
  currentIndex: number;
  playState: PlayState;
  error: string | null;
  showSettings: boolean;
  visibleParagraphs: Paragraph[];

  // Actions
  setSettings: (updater: (s: Settings) => Settings) => void;
  patchSettings: (patch: Partial<Settings>) => void;
  setFilterRule: (key: keyof Settings["filter_rules"], value: boolean) => void;
  setApiKey: (provider: ProviderId, key: string) => void;
  setRegion: (provider: ProviderId, region: string) => void;
  setGroupId: (provider: ProviderId, groupId: string) => void;

  setParsed: (p: ParsedPdf | null) => void;
  setParsing: (v: boolean) => void;
  setParseProgress: (p: { loaded: number; total: number } | null) => void;

  setCurrentIndex: (i: number) => void;
  setPlayState: (s: PlayState) => void;
  setError: (e: string | null) => void;
  setShowSettings: (v: boolean) => void;
  setVisibleParagraphs: (p: Paragraph[]) => void;

  reset: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  settings: loadSettings(),
  parsed: null,
  parsing: false,
  parseProgress: null,

  currentIndex: -1,
  playState: "idle",
  error: null,
  showSettings: false,
  visibleParagraphs: [],

  setSettings: (updater) => {
    const next = updater(get().settings);
    saveSettings(next);
    set({ settings: next });
  },
  patchSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    saveSettings(next);
    set({ settings: next });
  },
  setFilterRule: (key, value) => {
    const next = {
      ...get().settings,
      filter_rules: { ...get().settings.filter_rules, [key]: value },
    };
    saveSettings(next);
    set({ settings: next });
  },
  setApiKey: (provider, key) => {
    const next = {
      ...get().settings,
      api_keys: { ...get().settings.api_keys, [provider]: key },
    };
    saveSettings(next);
    set({ settings: next });
  },
  setRegion: (provider, region) => {
    const next = {
      ...get().settings,
      regions: { ...get().settings.regions, [provider]: region },
    };
    saveSettings(next);
    set({ settings: next });
  },
  setGroupId: (provider, groupId) => {
    const next = {
      ...get().settings,
      group_ids: { ...get().settings.group_ids, [provider]: groupId },
    };
    saveSettings(next);
    set({ settings: next });
  },
  setParsed: (p) => set({ parsed: p }),
  setParsing: (v) => set({ parsing: v }),
  setParseProgress: (p) => set({ parseProgress: p }),

  setCurrentIndex: (i) => set({ currentIndex: i }),
  setPlayState: (s) => set({ playState: s }),
  setError: (e) => set({ error: e }),
  setShowSettings: (v) => set({ showSettings: v }),
  setVisibleParagraphs: (p) => set({ visibleParagraphs: p }),

  reset: () =>
    set({
      parsed: null,
      currentIndex: -1,
      playState: "idle",
      error: null,
      parseProgress: null,
      visibleParagraphs: [],
    }),
}));

// 选择器:获取可朗读段落(过滤后的正文)
export function selectReadable(parsed: ParsedPdf | null): Paragraph[] {
  if (!parsed) return [];
  return parsed.paragraphs.filter(
    (p) => p.kind === "body" || p.kind === "heading" || p.kind === "title"
  );
}
