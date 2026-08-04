import { useQueryClient } from "@tanstack/react-query";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import { ipc } from "@/lib/ipc";
import { useAppStore } from "@/stores/app-store";
import { glossaryKey } from "./glossary-page";
import { projectKey } from "@/features/project/use-project";

/** Pick a glossary.json and install it into `folder`.
 *  Shared by CreateView ("Start from an existing glossary…") and EditorView
 *  ("Import glossary…"). Any existing glossary is backed up to
 *  glossary.prev.json by the backend, so this doubles as re-generate undo. */
export function useImportGlossary(folder: string) {
  const qc = useQueryClient();
  return async () => {
    const picked = await openDialog({
      multiple: false,
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (!picked || Array.isArray(picked)) return;
    try {
      const count = await ipc.importGlossary(folder, picked);
      // The user may have switched folders while the dialog was open — the
      // import still belongs to `folder`, but don't touch the active view's
      // rail badge with another folder's count.
      await qc.invalidateQueries({ queryKey: glossaryKey(folder) });
      await qc.invalidateQueries({ queryKey: projectKey(folder) });
      if (useAppStore.getState().workdir === folder) {
        useAppStore.getState().setGlossaryTerms(count);
      }
      toast.success(`Imported ${count} term${count !== 1 ? "s" : ""}`);
    } catch (e: unknown) {
      toast.error(String(e));
    }
  };
}
