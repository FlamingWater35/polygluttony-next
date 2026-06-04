import { createFileRoute } from "@tanstack/react-router";
import { ipc } from "@/lib/ipc";
import { useAppStore } from "@/stores/app-store";
import { WelcomePage } from "@/features/welcome/welcome-page";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Seed the rail badge before first render (Welcome shows the first-run steps
    // when there's no usable connection; no auto-redirect to Connections).
    const status = await ipc.firstRunStatus();
    useAppStore.getState().setHasUsableConnection(status.has_usable_connection);
  },
  component: WelcomePage,
});
