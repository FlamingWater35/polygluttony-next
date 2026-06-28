import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

/** Free-typing combobox over curated ∪ live-fetched model ids. */
export function ModelCombobox({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const merged = Array.from(new Set([value, ...options].filter(Boolean)));
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          {value || "Select or type a model…"}
          <CaretDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder="Search or type a model…"
            value={value}
            onValueChange={onChange}
          />
          <CommandList>
            <CommandEmpty>Use &quot;{value}&quot; (custom)</CommandEmpty>
            <CommandGroup>
              {merged.map((m) => (
                <CommandItem
                  key={m}
                  value={m}
                  onSelect={(v) => {
                    onChange(v);
                    setOpen(false);
                  }}
                >
                  {m}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
