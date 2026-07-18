import { Settings as SettingsIcon, BookAudio } from "lucide-react";
import { useStore } from "@/lib/store";

export default function Header() {
  const setShowSettings = useStore((s) => s.setShowSettings);
  return (
    <header className="sticky top-0 z-30 glass-ios18 border-b border-black/[0.04] pt-safe pl-safe pr-safe">
      <div className="mx-auto flex h-12 max-w-[980px] items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-br from-accent to-[#7c50ff] shadow-soft">
            <BookAudio className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-body font-semibold tracking-tight text-ink">
            PDF Voice
          </span>
        </div>
        <button
          type="button"
          className="btn-icon touch-ios18"
          onClick={() => setShowSettings(true)}
          aria-label="打开设置"
        >
          <SettingsIcon className="h-5 w-5" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}
