import { useEffect, useState } from "react";
import { useBlocker } from "@tanstack/react-router";
import { confirm as confirmDialog } from "@tauri-apps/plugin-dialog";
import { Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { PromptId } from "@/types/generated/PromptId";
import { PageHeader } from "@/components/page-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { usePrompts, usePromptText, usePromptMutations } from "./use-prompts";
import { PromptList } from "./prompt-list";
import { PromptEditor } from "./prompt-editor";

export function SettingsPage() {
  const { data: prompts } = usePrompts();
  const m = usePromptMutations();
  const [selected, setSelected] = useState<PromptId | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [pendingSelect, setPendingSelect] = useState<PromptId | null>(null);
  const { data: loaded, error: loadError } = usePromptText(selected);

  useEffect(() => {
    if (!selected && prompts?.length) setSelected(prompts[0].id);
  }, [prompts, selected]);

  const meta = prompts?.find((p) => p.id === selected);
  const dirty = draft !== null && loaded !== undefined && draft !== loaded;

  // Fix 3: block navigation away when there are unsaved changes
  // window.confirm is a no-op in WKWebView (Tauri/macOS) — use native dialog instead.
  useBlocker({
    shouldBlockFn: async () => {
      if (!dirty) return false;
      const leave = await confirmDialog("Discard unsaved prompt changes?", {
        title: "Unsaved changes",
        kind: "warning",
      });
      return !leave;
    },
    disabled: !dirty,
  });

  const select = (id: PromptId) => {
    if (id === selected) return;
    if (dirty) {
      setPendingSelect(id);
      return;
    }
    setSelected(id);
    setDraft(null);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Settings"
        description="Customize the prompts sent to the AI. Restore any prompt to its default at any time."
      />
      <div className="flex min-h-0 flex-1">
        <PromptList prompts={prompts} selected={selected} onSelect={select} />
        {meta && loadError ? (
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 p-6">
            <Warning className="size-8 text-[color:var(--color-alert)]" />
            <p className="max-w-sm text-center text-[12.5px] text-[color:var(--color-alert)]">
              {String(loadError)}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await m.reset.mutateAsync(meta.id);
                  setDraft(null);
                  toast.success(`"${meta.name}" restored to default`);
                } catch (e) {
                  toast.error(String(e));
                }
              }}
            >
              Restore default
            </Button>
          </div>
        ) : meta && loaded !== undefined ? (
          <PromptEditor
            key={meta.id}
            meta={meta}
            loaded={loaded}
            draft={draft}
            onDraftChange={setDraft}
            saving={m.save.isPending}
            onSave={async (text) => {
              try {
                await m.save.mutateAsync({ id: meta.id, text });
                setDraft(null);
                toast.success(`Saved "${meta.name}"`);
              } catch (e) {
                toast.error(String(e));
              }
            }}
            onReset={async () => {
              try {
                await m.reset.mutateAsync(meta.id);
                setDraft(null);
                toast.success(`"${meta.name}" restored to default`);
              } catch (e) {
                toast.error(String(e));
              }
            }}
          />
        ) : null}
      </div>

      <AlertDialog
        open={pendingSelect !== null}
        onOpenChange={(open) => {
          if (!open) setPendingSelect(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{meta?.name}&rdquo; has edits you haven&apos;t saved. Switching prompts will
              discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingSelect) {
                  setSelected(pendingSelect);
                  setDraft(null);
                  setPendingSelect(null);
                }
              }}
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
