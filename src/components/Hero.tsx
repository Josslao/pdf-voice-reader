import { Sparkles } from "lucide-react";
import UploadCard from "./UploadCard";
import { useStore } from "@/lib/store";

export default function Hero() {
  const parsed = useStore((s) => s.parsed);
  const stats = parsed?.stats;
  return (
    <section className="pt-8 pb-4 sm:pt-14 sm:pb-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-paper-subtle px-3 py-1 text-caption font-medium text-ink-soft">
          <Sparkles className="h-3 w-3 text-accent" strokeWidth={1.75} />
          多家大模型 · 自然人声朗读
        </div>
        <h1 className="mt-4 text-[2rem] leading-[1.15] font-semibold tracking-tight text-gradient-ios18 sm:mt-5 sm:text-hero">
          聆听你的 PDF
        </h1>
        <p className="mx-auto mt-3 max-w-[640px] px-4 text-footnote text-ink-muted sm:mt-4 sm:text-body">
          上传 PDF 文件,选择大语言模型厂商与人声音色,
          自动识别并跳过目录、注脚、注示等非正文内容。
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-[680px] px-4 sm:mt-8">
        <UploadCard />
      </div>

      {stats && (
        <div className="mx-auto mt-5 grid max-w-[680px] grid-cols-3 gap-2 px-4 sm:mt-6 sm:gap-3">
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
    <div className="card-ios18 px-2 py-2.5 text-center sm:px-4 sm:py-3">
      <div
        className={`text-title font-semibold tabular-nums sm:text-title ${
          accent ? "text-accent" : "text-ink"
        }`}
      >
        {value}
      </div>
      <div className="mt-0.5 text-caption text-ink-muted sm:text-footnote">
        {label}
      </div>
    </div>
  );
}
