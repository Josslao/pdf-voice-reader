import { Settings as SettingsIcon, BookAudio } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Header() {
  const setShowSettings = useStore((s) => s.setShowSettings);
  return (
    <header className="sticky top-0 z-30 glass border-b border-black/[0.06]">
      <div className="mx-auto flex h-12 max-w-[980px] items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <BookAudio className="h-5 w-5 text-accent" strokeWidth={1.75} />
          <span className="text-body font-semibold tracking-tight text-ink">
            PDF Voice
          </span>
        </div>
        <button
          type="button"
          className="btn-icon"
          onClick={() => setShowSettings(true)}
          aria-label="打开设置"
        >
          <SettingsIcon className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
