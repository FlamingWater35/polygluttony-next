import { CheckCircle } from "@phosphor-icons/react";
import type { SourceFile } from "@/types/generated/SourceFile";
import { Checkbox } from "@/components/ui/checkbox";

/**
 * Source-file list with per-file selection. An empty `selected` array means
 * "all files selected" (the backend's convention); the header checkbox resets
 * to that state.
 */
export function FileList({
  files,
  selected,
  onChange,
}: {
  files: SourceFile[];
  selected: string[];
  onChange: (sel: string[]) => void;
}) {
  const allSelected = selected.length === 0;
  const isChecked = (name: string) => allSelected || selected.includes(name);

  const toggle = (name: string) => {
    const base = allSelected ? files.map((f) => f.name) : selected;
    const next = base.includes(name) ? base.filter((n) => n !== name) : [...base, name];
    // Re-selecting everything normalizes back to "all" (empty array).
    onChange(next.length === files.length ? [] : next);
  };

  return (
    <div className="mt-4 rounded-md border border-border">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-[11px] text-muted-foreground">
        <Checkbox checked={allSelected} onCheckedChange={() => onChange([])} />
        <span>
          {files.length} files{" "}
          {allSelected ? "· all selected" : `· ${selected.length} selected`}
        </span>
      </div>
      <ul className="max-h-64 overflow-auto">
        {files.map((f) => (
          <li key={f.path} className="flex items-center gap-2 px-3 py-1.5 text-[12px]">
            <Checkbox checked={isChecked(f.name)} onCheckedChange={() => toggle(f.name)} />
            <span className="flex-1 truncate">{f.name}</span>
            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {f.dialogue_count} lines
            </span>
            {f.has_translation ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-[10px] text-[color:var(--color-success)]">
                <CheckCircle weight="fill" className="size-3" />
                translated
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
