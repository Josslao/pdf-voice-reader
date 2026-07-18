import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { getAllProviders } from "@/lib/tts";
import type { ProviderId } from "@/lib/types";
import { ChevronDown, KeyRound } from "lucide-react";

export default function ProviderVoicePicker() {
  const providers = useMemo(() => getAllProviders(), []);
  const settings = useStore((s) => s.settings);
  const patchSettings = useStore((s) => s.patchSettings);
  const setShowSettings = useStore((s) => s.setShowSettings);

  const currentProvider = providers.find((p) => p.meta.id === settings.default_provider);
  const voices = currentProvider?.meta.voices ?? [];

  const hasKey = Boolean(settings.api_keys[settings.default_provider]);

  return (
    <div className="card-apple p-5">
      <div className="text-body font-semibold text-ink mb-1">朗读引擎</div>
      <div className="text-footnote text-ink-muted mb-4">
        选择大语言模型厂商与人声音色
      </div>

      {/* 厂商分段控件 */}
      <div className="scrollbar-apple overflow-x-auto -mx-1 px-1">
        <div className="segment flex w-max gap-1">
          {providers.map((p) => {
            const active = p.meta.id === settings.default_provider;
            return (
              <button
                key={p.meta.id}
                type="button"
                onClick={() => {
                  // 切换厂商时若默认音色不存在则切到第一个
                  const nextVoice =
                    p.meta.voices[0]?.id ?? settings.default_voice;
                  patchSettings({
                    default_provider: p.meta.id as ProviderId,
                    default_voice: nextVoice,
                  });
                }}
                className={`segment-item whitespace-nowrap ${
                  active ? "segment-item-active" : ""
                }`}
              >
                {p.meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 当前厂商描述 */}
      <div className="mt-3 text-footnote text-ink-muted">
        {currentProvider?.meta.description}
      </div>

      {/* 音色选择 */}
      <div className="mt-4">
        <label className="text-footnote font-medium text-ink-soft">
          人声音色
        </label>
        <div className="relative mt-1.5">
          <select
            value={settings.default_voice}
            onChange={(e) => patchSettings({ default_voice: e.target.value })}
            className="input-apple appearance-none pr-10 cursor-pointer"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label} · {v.description}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted"
            strokeWidth={1.75}
          />
        </div>
      </div>

      {/* 语速 */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <label className="text-footnote font-medium text-ink-soft">
            语速
          </label>
          <span className="text-footnote text-ink-muted tabular-nums">
            {settings.default_speed.toFixed(2)}×
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={2.0}
          step={0.05}
          value={settings.default_speed}
          onChange={(e) =>
            patchSettings({ default_speed: parseFloat(e.target.value) })
          }
          className="mt-2 w-full accent-accent"
          aria-label="语速"
        />
      </div>

      {/* API Key 状态 */}
      <div className="mt-4 flex items-center justify-between rounded-apple bg-paper-subtle px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <KeyRound
            className={`h-4 w-4 ${hasKey ? "text-success" : "text-warning"}`}
            strokeWidth={1.75}
          />
          <span className="text-footnote text-ink-soft">
            {hasKey ? "API Key 已配置" : "未配置 API Key"}
          </span>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setShowSettings(true)}
        >
          {hasKey ? "修改" : "去配置"}
        </button>
      </div>
    </div>
  );
}
