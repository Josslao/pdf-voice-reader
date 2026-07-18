import { Sparkles } from "lucide-react";
import UploadCard from "./UploadCard";
import { useStore } from "@/lib/store";

export default function Hero() {
  const parsed = useStore((s) => s.parsed);
  const stats = parsed?.stats;
  return (
    <section className="pt-14 pb-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-paper-subtle px-3 py-1 text-caption font-medium text-ink-soft">
          <Sparkles className="h-3 w-3 text-accent" strokeWidth={1.75} />
          多家大模型 · 自然人声朗读
        </div>
        <h1 className="mt-5 text-hero font-semibold tracking-tight text-gradient">
          聆听你的 PDF
        </h1>
        <p className="mx-auto mt-4 max-w-[640px] text-body text-ink-muted">
          上传 PDF 文件,选择大语言模型厂商与人声音色,
          自动识别并跳过目录、注脚、注示等非正文内容,获得类真人的朗读体验。
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-[680px]">
        <UploadCard />
      </div>

      {stats && (
        <div className="mx-auto mt-6 grid max-w-[680px] grid-cols-3 gap-3">
          <Stat label="总段数" value={stats.total} />
          <Stat label="可朗读" value={stats.readable} accent />
          <Stat label="已跳过" value={stats.skipped} />
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="card-apple px-4 py-3 text-center">
      <div
        className={`text-title font-semibold tabular-nums ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-footnote text-ink-muted">{label}</div>
    </div>
  );
}
