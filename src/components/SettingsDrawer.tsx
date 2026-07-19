import { useEffect } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { getAllProviders } from "@/lib/tts";
import type { ProviderId, Settings } from "@/lib/types";
import Switch from "./Switch";

export default function SettingsDrawer() {
  const open = useStore((s) => s.showSettings);
  const setOpen = useStore((s) => s.setShowSettings);
  const settings = useStore((s) => s.settings);
  const setApiKey = useStore((s) => s.setApiKey);
  const setRegion = useStore((s) => s.setRegion);
  const setGroupId = useStore((s) => s.setGroupId);
  const setFilterRule = useStore((s) => s.setFilterRule);
  const patchSettings = useStore((s) => s.patchSettings);

  // Esc 关闭(桌面端)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const providers = getAllProviders();

  return (
    <>
      {/* 遮罩 */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300-apple ease-apple ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* iOS 18 风格底部 sheet(桌面端为右侧抽屉)
       * Android 上:max-h-[88dvh] 避免与状态栏冲突,
       * 配合 safe-top 让顶部抓手/标题不被遮挡
       */}
      <aside
        className={`fixed z-50 flex flex-col bg-paper rounded-t-apple-xl shadow-elevated transition-transform duration-400-apple ease-apple
          left-0 right-0 bottom-0 max-h-[88dvh] rounded-t-apple-xl safe-top safe-x
          sm:left-auto sm:top-0 sm:right-0 sm:h-full sm:w-full sm:max-w-[440px] sm:rounded-t-none sm:pt-0 sm:translate-y-0
          ${open
            ? "translate-y-0 sm:translate-x-0"
            : "translate-y-full sm:translate-y-0 sm:translate-x-full"
          }`}
        aria-hidden={!open}
      >
        {/* iOS 18 抓手 */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="h-1 w-9 rounded-full bg-ink-faint/30" />
        </div>

        <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-3.5">
          <div>
            <div className="text-headline font-semibold text-ink">设置</div>
            <div className="text-caption text-ink-muted sm:text-footnote">
              API Key 与朗读偏好本地保存
            </div>
          </div>
          <button
            type="button"
            className="btn-icon touch-ios18"
            onClick={() => setOpen(false)}
            aria-label="关闭"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="scrollbar-none sm:scrollbar-apple flex-1 overflow-y-auto px-4 py-4 sm:px-5 pb-safe">
          {/* 默认参数 */}
          <Section title="默认朗读参数">
            <div className="space-y-1">
              <Row label="默认厂商">
                <select
                  className="input-apple w-36 sm:w-40"
                  value={settings.default_provider}
                  onChange={(e) => {
                    const id = e.target.value as ProviderId;
                    const p = providers.find((x) => x.meta.id === id);
                    const v = p?.meta.voices[0]?.id ?? settings.default_voice;
                    patchSettings({ default_provider: id, default_voice: v });
                  }}
                >
                  {providers.map((p) => (
                    <option key={p.meta.id} value={p.meta.id}>
                      {p.meta.label}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="默认音色">
                <select
                  className="input-apple w-36 sm:w-40"
                  value={settings.default_voice}
                  onChange={(e) =>
                    patchSettings({ default_voice: e.target.value })
                  }
                >
                  {providers
                    .find((p) => p.meta.id === settings.default_provider)
                    ?.meta.voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                </select>
              </Row>
              <Row label={`默认语速 · ${settings.default_speed.toFixed(2)}×`}>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.05}
                  value={settings.default_speed}
                  onChange={(e) =>
                    patchSettings({ default_speed: parseFloat(e.target.value) })
                  }
                  className="w-36 sm:w-40 accent-accent"
                />
              </Row>
            </div>
          </Section>

          {/* 跳过规则 */}
          <Section title="正文过滤规则">
            <div className="space-y-1">
              {(
                [
                  ["skip_toc", "目录", "连续点号 + 页码形式"],
                  ["skip_footnotes", "注脚", "[1] ① 1) * † 上标编号"],
                  ["skip_annotations", "注示", "以「注:」「Note:」等开头"],
                  ["skip_header_footer", "页眉页脚", "每页首尾短行"],
                  ["skip_references", "参考文献", "「参考文献」起至文末"],
                  ["skip_copyright", "版权信息", "Copyright / 版权所有"],
                ] as Array<[keyof Settings["filter_rules"], string, string]>
              ).map(([key, label, desc]) => (
                <Switch
                  key={key}
                  checked={settings.filter_rules[key]}
                  onChange={(v) => setFilterRule(key, v)}
                  label={label}
                  description={desc}
                />
              ))}
            </div>
          </Section>

          {/* API Key 管理 */}
          <Section title="API Key 管理">
            <div className="space-y-3">
              {providers.map((p) => (
                <ProviderKey
                  key={p.meta.id}
                  id={p.meta.id}
                  label={p.meta.label}
                  description={p.meta.description}
                  placeholder={p.meta.keyPlaceholder ?? "在此输入 API Key"}
                  hint={p.meta.keyHint}
                  value={settings.api_keys[p.meta.id] ?? ""}
                  needsRegion={p.meta.needsRegion}
                  region={settings.regions[p.meta.id] ?? ""}
                  needsGroupId={p.meta.needsGroupId}
                  groupId={settings.group_ids[p.meta.id] ?? ""}
                  onChange={(v) => setApiKey(p.meta.id, v)}
                  onRegionChange={(v) => setRegion(p.meta.id, v)}
                  onGroupIdChange={(v) => setGroupId(p.meta.id, v)}
                />
              ))}
            </div>
          </Section>

          <div className="px-1 pt-2 pb-6 text-caption text-ink-faint">
            所有 API Key 仅保存在本机 localStorage,不会上传任何服务器。
            朗读请求由浏览器直接发送至所选厂商。
            <br />
            <span className="text-warning">
              注意:MiniMax 与火山引擎可能不允许浏览器跨域调用,
              若报 CORS 错误,请改用 OpenAI 或 ElevenLabs(均支持浏览器直接调用)。
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-footnote font-semibold uppercase tracking-wide text-ink-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-footnote sm:text-body text-ink-soft">{label}</span>
      {children}
    </div>
  );
}

interface ProviderKeyProps {
  id: string;
  label: string;
  description: string;
  placeholder: string;
  hint?: string;
  value: string;
  needsRegion?: boolean;
  region: string;
  needsGroupId?: boolean;
  groupId: string;
  onChange: (v: string) => void;
  onRegionChange: (v: string) => void;
  onGroupIdChange: (v: string) => void;
}

function ProviderKey({
  label,
  description,
  placeholder,
  hint,
  value,
  needsRegion,
  region,
  needsGroupId,
  groupId,
  onChange,
  onRegionChange,
  onGroupIdChange,
}: ProviderKeyProps) {
  const [visible, setVisible] = useState(false);
  const filled = value.length > 0;
  return (
    <div className="rounded-apple border border-black/[0.06] bg-paper-card p-3">
      <div className="flex items-center justify-between">
        <div className="text-body font-medium text-ink">{label}</div>
        <span
          className={`text-caption font-medium ${
            filled ? "text-success" : "text-ink-faint"
          }`}
        >
          {filled ? "已配置" : "未配置"}
        </span>
      </div>
      <div className="mt-1 text-caption text-ink-muted">{description}</div>

      <div className="mt-2 flex items-center gap-1.5">
        <div className="relative flex-1">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="input-apple pr-9 font-mono text-footnote"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
            aria-label={visible ? "隐藏" : "显示"}
          >
            {visible ? (
              <EyeOff className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {hint && (
        <div className="mt-1.5 text-caption text-ink-faint leading-relaxed">
          {hint}
        </div>
      )}

      {needsRegion && (
        <div className="mt-2">
          <input
            type="text"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            placeholder="区域,如 eastus"
            className="input-apple font-mono text-footnote"
            autoComplete="off"
          />
        </div>
      )}

      {needsGroupId && (
        <div className="mt-2">
          <input
            type="text"
            value={groupId}
            onChange={(e) => onGroupIdChange(e.target.value)}
            placeholder="GroupId,例如 1234567890"
            className="input-apple font-mono text-footnote"
            autoComplete="off"
          />
          <div className="mt-1.5 text-caption text-ink-faint leading-relaxed">
            MiniMax 必填。登录 platform.minimaxi.com → 账户管理 → 找到「GroupId」复制粘贴。
          </div>
        </div>
      )}
    </div>
  );
}
