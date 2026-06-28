import type { ReactNode } from "react";

/** Labelled control + optional helper text. */
export function SetupField({
  label,
  htmlFor,
  help,
  children,
}: {
  label: string;
  htmlFor?: string;
  help?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label htmlFor={htmlFor} className="mb-1 block text-[11.5px] font-semibold">
        {label}
      </label>
      {children}
      {help}
    </div>
  );
}
