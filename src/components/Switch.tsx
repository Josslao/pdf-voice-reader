import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  description?: string;
}

export default function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex-1 min-w-0">
        {label && (
          <div className="text-body text-ink font-medium">{label}</div>
        )}
        {description && (
          <div className="text-footnote text-ink-muted mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("switch-apple", checked && "switch-apple-on")}
      >
        <span className={cn("switch-thumb", checked && "switch-thumb-on")} />
      </button>
    </div>
  );
}
