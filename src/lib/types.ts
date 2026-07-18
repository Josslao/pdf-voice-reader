// 类型定义

export type ProviderId = "openai" | "azure" | "minimax" | "volc" | "elevenlabs";

export interface Voice {
  id: string;
  label: string;
  gender: "male" | "female" | "neutral";
  description?: string;
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  description: string;
  voices: Voice[];
  needsRegion?: boolean;
  needsGroupId?: boolean;
  keyPrefix?: string;
  keyPlaceholder?: string;
  keyHint?: string;
}

export interface FilterRules {
  skip_toc: boolean;
  skip_footnotes: boolean;
  skip_annotations: boolean;
  skip_header_footer: boolean;
  skip_references: boolean;
  skip_copyright: boolean;
}

export interface Settings {
  default_provider: ProviderId;
  default_voice: string;
  default_speed: number;
  api_keys: Partial<Record<ProviderId, string>>;
  regions: Partial<Record<ProviderId, string>>;
  group_ids: Partial<Record<ProviderId, string>>;
  filter_rules: FilterRules;
}

export interface Paragraph {
  id: number;
  text: string;
  page: number;
  kind: ParagraphKind;
}

export type ParagraphKind =
  | "body"
  | "title"
  | "heading"
  | "toc"
  | "footnote"
  | "annotation"
  | "header_footer"
  | "references"
  | "copyright";

export interface ParsedPdf {
  fileName: string;
  totalPages: number;
  paragraphs: Paragraph[];
  stats: {
    total: number;
    readable: number;
    skipped: number;
    by_kind: Record<Paragraph["kind"], number>;
  };
}

export interface TTSOptions {
  speed: number;
  format?: "mp3" | "wav" | "ogg";
}

export interface TTSProvider {
  meta: ProviderMeta;
  synthesize(
    text: string,
    voiceId: string,
    options: TTSOptions,
    credentials: { apiKey: string; region?: string; groupId?: string }
  ): Promise<Blob>;
}
