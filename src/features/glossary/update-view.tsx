import { useState } from "react";
import { ArrowsClockwise, Plus } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { ProjectView } from "@/types/generated/ProjectView";
import type { GlossaryDoc } from "@/types/generated/GlossaryDoc";
import type { WorldType } from "@/types/generated/WorldType";
import type { BuildMode } from "@/types/generated/BuildMode";
import { ipc } from "@/lib/ipc";
import { useGlossaryRun } from "@/stores/glossary-store";
import { GlossaryBuildOptions } from "./glossary-build-options";
import { Button } from "@/components/ui/button";
import { HelpText } from "@/components/help-text";
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

export function UpdateView({ view, doc }: { view: ProjectView; doc: GlossaryDoc }) {
  const { startOp, endOp, closeUpdate } = useGlossaryRun.getState();
  const busy = useGlossaryRun((s) => s.busy);

  const [mode, setMode] = useState<BuildMode>("append");
  const [normalize, setNormalize] = useState(true);
  const [personalize, setPersonalize] = useState(false);
  const [context, setContext] = useState("");
  const [confirming, setConfirming] = useState(false);

  const selected = view.prefs.selected_files;
  const effectiveWorld: WorldType = view.prefs.world_override ?? view.detected_world;
  const canRun = selected.length > 0 && busy === null;

  const run = () => {
    setConfirming(false);
    // Leave the update screen before the run so that when BuildProgress
    // finishes we land on the editor — which surfaces the post-build diff.
    closeUpdate();
    startOp("build", view.folder);
    // Rejected invoke = run never started; un-stick the page.
    ipc
      .startGlossaryBuild({
        folder: view.folder,
        mode,
        files: selected,
        worldType: effectiveWorld,
        sourceLang: view.prefs.source_lang,
        targetLang: view.prefs.target_lang,
        normalize,
        personalize,
        personalizeContext: context,
      })
      .catch((e: unknown) => {
        endOp();
        toast.error(String(e));
      });
  };

  const submit = () => {
    if (mode === "regenerate") setConfirming(true);
    else run();
  };

  // A div, not a button: the Append card contains checkboxes, and a <button>
  // inside a <button> is invalid HTML. Clicking anywhere in a card selects its
  // mode — including the checkboxes, which is what you want anyway, since
  // touching Append's options means you're choosing Append.
  const cardCls = (active: boolean) =>
    `cursor-pointer rounded-lg border p-5 text-left transition-colors ${
      active
        ? "border-primary bg-[color:var(--color-bg-raised)]"
        : "border-border bg-[color:var(--card)] hover:border-primary/40"
    }`;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Update glossary"
        description={`This folder's glossary has ${doc.count} terms. Choose how to bring the selected files in.`}
        actions={
          <Button size="sm" variant="secondary" onClick={closeUpdate}>
            ← Back to glossary
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Append */}
          <div
            role="radio"
            aria-checked={mode === "append"}
            tabIndex={0}
            className={cardCls(mode === "append")}
            onClick={() => setMode("append")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setMode("append");
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Plus weight="duotone" className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Append to glossary</h2>
            </div>
            <p className="mb-4 text-[12.5px] text-muted-foreground">
              Scan the selected files and add only terms you don&apos;t already have. Every existing
              term keeps its current translation — including ones you edited by hand.
            </p>

            <GlossaryBuildOptions
              normalize={normalize}
              onNormalizeChange={setNormalize}
              personalize={personalize}
              onPersonalizeChange={setPersonalize}
              context={context}
              onContextChange={setContext}
              normalizeHelp="Merges duplicate names and fixes inconsistent spellings among the new terms."
              disabled={mode !== "append"}
            />
          </div>

          {/* Re-generate */}
          <div
            role="radio"
            aria-checked={mode === "regenerate"}
            tabIndex={0}
            className={cardCls(mode === "regenerate")}
            onClick={() => setMode("regenerate")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setMode("regenerate");
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <ArrowsClockwise weight="duotone" className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Re-generate from scratch</h2>
            </div>
            <p className="mb-3 text-[12.5px] text-muted-foreground">
              Throw away all {doc.count} current terms and build a brand-new glossary from the
              selected files. Anything you edited by hand is lost.
            </p>
            <p className="text-[11px] text-muted-foreground">
              A copy of the current glossary is kept as{" "}
              <span className="text-foreground">glossary.prev.json</span> — you can bring it back
              with Import glossary…
            </p>
          </div>
        </div>

        <HelpText>
          Files come from your Project selection. To scan only the new episodes, select just those in
          Project first.
        </HelpText>
      </div>

      <div className="flex items-center gap-3 border-t border-border bg-[color:var(--popover)] px-5 py-3">
        <Button onClick={submit} disabled={!canRun}>
          {mode === "append" ? "Append to glossary →" : "Re-generate glossary →"}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          {selected.length === 0
            ? "Select files in Project first."
            : `${selected.length} file${selected.length !== 1 ? "s" : ""} · world: ${effectiveWorld}`}
        </span>
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-generate this glossary?</AlertDialogTitle>
            <AlertDialogDescription>
              All {doc.count} current terms will be discarded and rebuilt from the{" "}
              {selected.length} selected file{selected.length !== 1 ? "s" : ""}. Hand-edited
              translations are lost. A copy is kept as glossary.prev.json.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={run}>Re-generate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
