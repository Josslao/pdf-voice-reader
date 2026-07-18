import { useCallback, useRef, useState } from "react";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { useStore } from "@/lib/store";
import { parsePdf } from "@/lib/pdfParser";

export default function UploadCard() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const settings = useStore((s) => s.settings);
  const setParsed = useStore((s) => s.setParsed);
  const setParsing = useStore((s) => s.setParsing);
  const setParseProgress = useStore((s) => s.setParseProgress);
  const setVisibleParagraphs = useStore((s) => s.setVisibleParagraphs);
  const setCurrentIndex = useStore((s) => s.setCurrentIndex);
  const setPlayState = useStore((s) => s.setPlayState);
  const setError = useStore((s) => s.setError);
  const reset = useStore((s) => s.reset);
  const parsing = useStore((s) => s.parsing);
  const parseProgress = useStore((s) => s.parseProgress);
  const parsed = useStore((s) => s.parsed);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file) return;
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setLocalError("仅支持 PDF 文件");
        return;
      }
      setLocalError(null);
      reset();
      setParsing(true);
      setParseProgress({ loaded: 0, total: 0 });
      try {
        const result = await parsePdf(file, settings.filter_rules, (loaded, total) => {
          setParseProgress({ loaded, total });
        });
        setParsed(result);
        setVisibleParagraphs(
          result.paragraphs.filter(
            (p) => p.kind === "body" || p.kind === "heading" || p.kind === "title"
          )
        );
        setCurrentIndex(result.paragraphs.length > 0 ? 0 : -1);
        setPlayState("idle");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setParsing(false);
        setParseProgress(null);
      }
    },
    [
      settings.filter_rules,
      reset,
      setParsed,
      setParsing,
      setParseProgress,
      setVisibleParagraphs,
      setCurrentIndex,
      setPlayState,
      setError,
    ]
  );

  const progress = parseProgress
    ? parseProgress.total > 0
      ? Math.round((parseProgress.loaded / parseProgress.total) * 100)
      : 0
    : null;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
      className={`relative overflow-hidden rounded-apple-xl border-2 border-dashed bg-paper-card transition-all duration-300-apple ease-apple ${
        dragOver
          ? "border-accent bg-accent-soft scale-[1.01]"
          : "border-black/10 hover:border-accent/40 hover:bg-paper-subtle"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="flex flex-col items-center justify-center gap-4 px-4 py-10 text-center sm:px-6 sm:py-12">
        {parsing ? (
          <>
            <div className="relative">
              <Loader2 className="h-12 w-12 text-accent animate-spin" strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-headline font-semibold text-ink">正在解析 PDF</div>
              <div className="mt-1 text-footnote text-ink-muted">
                识别并过滤非正文内容{progress !== null ? ` · ${progress}%` : ""}
              </div>
            </div>
            {progress !== null && (
              <div className="h-1 w-48 overflow-hidden rounded-full bg-paper-subtle">
                <div
                  className="h-full bg-accent transition-all duration-300-apple ease-apple"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </>
        ) : parsed ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-3 transition-opacity active:scale-[0.98] touch-ios18"
          >
            <FileText className="h-12 w-12 text-accent" strokeWidth={1.5} />
            <div>
              <div className="text-headline font-semibold text-ink line-clamp-1">
                {parsed.fileName}
              </div>
              <div className="mt-1 text-footnote text-ink-muted">
                共 {parsed.totalPages} 页 · 可朗读 {parsed.stats.readable} 段 ·
                已跳过 {parsed.stats.skipped} 段
              </div>
              <div className="mt-2 text-footnote text-accent font-medium">
                点击替换文件
              </div>
            </div>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-3 touch-ios18"
          >
            <div className="rounded-full bg-accent-soft p-5">
              <UploadCloud className="h-8 w-8 text-accent" strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-headline font-semibold text-ink">
                点击选择 PDF
              </div>
              <div className="mt-1 text-footnote text-ink-muted">
                仅支持本地解析,文件不会上传服务器
              </div>
            </div>
          </button>
        )}
      </div>

      {localError && (
        <div className="px-6 pb-4 text-center text-footnote text-danger">
          {localError}
        </div>
      )}
    </div>
  );
}
