import { useEffect, useMemo, useRef } from "react";
import { ListChecks } from "lucide-react";
import { useStore } from "@/lib/store";
import { isReadable, getKindLabel } from "@/lib/pdfParser";
import type { Paragraph } from "@/lib/types";

interface ReaderViewProps {
  currentIndex: number; // 可朗读段落列表中的索引
  onJump: (idx: number) => void;
}

const KIND_COLOR: Record<Paragraph["kind"], string> = {
  body: "text-ink",
  title: "text-ink font-semibold",
  heading: "text-ink font-semibold",
  toc: "text-ink-faint",
  footnote: "text-ink-faint",
  annotation: "text-ink-faint",
  header_footer: "text-ink-faint",
  references: "text-ink-faint",
  copyright: "text-ink-faint",
};

export default function ReaderView({ currentIndex, onJump }: ReaderViewProps) {
  const parsed = useStore((s) => s.parsed);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);

  const readableList = useMemo(
    () => (parsed?.paragraphs ?? []).filter((p) => isReadable(p.kind)),
    [parsed]
  );
  const idToReadableIdx = useMemo(() => {
    const m = new Map<number, number>();
    readableList.forEach((p, i) => m.set(p.id, i));
    return m;
  }, [readableList]);

  const activeParagraphId =
    currentIndex >= 0 && currentIndex < readableList.length
      ? readableList[currentIndex].id
      : -1;

  useEffect(() => {
    if (!activeRef.current) return;
    activeRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeParagraphId]);

  if (!parsed) return null;

  const total = parsed.paragraphs.length;

  return (
    <div className="card-ios18 overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/[0.05] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-body font-semibold text-ink">
          <ListChecks className="h-4 w-4 text-accent" strokeWidth={1.75} />
          正文预览
        </div>
        <div className="text-caption text-ink-muted sm:text-footnote">
          共 {total} 段 · 可朗读 {readableList.length} 段
        </div>
      </div>

      <div
        ref={containerRef}
        className="scrollbar-none max-h-[55vh] overflow-y-auto px-3 py-3 sm:scrollbar-apple sm:max-h-[60vh] sm:px-5 sm:py-4"
      >
        <div className="space-y-2 sm:space-y-3">
          {parsed.paragraphs.map((p) => {
            const readable = isReadable(p.kind);
            const isActive = p.id === activeParagraphId;
            return (
              <div
                key={p.id}
                ref={isActive ? activeRef : null}
                className={`group relative rounded-apple px-3 py-2 transition-all duration-300-apple ease-apple ${
                  isActive
                    ? "bg-accent-soft shadow-soft ring-1 ring-accent/20"
                    : "active:bg-paper-subtle"
                } ${!readable ? "opacity-50" : ""}`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-paper-subtle px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                    {getKindLabel(p.kind)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-footnote leading-[1.7] sm:text-body ${KIND_COLOR[p.kind]}`}
                    >
                      {p.text}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-ink-faint">
                      <span>第 {p.page} 页</span>
                      {readable && (
                        <button
                          type="button"
                          className="opacity-100 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 text-accent hover:text-accent-hover font-medium"
                          onClick={() => {
                            const idx = idToReadableIdx.get(p.id);
                            if (idx !== undefined) onJump(idx);
                          }}
                        >
                          从此处朗读
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
