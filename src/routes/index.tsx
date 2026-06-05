import { createFileRoute } from "@tanstack/react-router";
import { ipc } from "@/lib/ipc";
import { useAppStore } from "@/stores/app-store";
import { WelcomePage } from "@/features/welcome/welcome-page";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Seed connection state before first paint so it's correct everywhere (status
    // bar + rail badge) without first visiting Connections: the active connection
    // name and whether any connection is usable.
    const view = await ipc.listConnections();
    const store = useAppStore.getState();
    store.setActiveConnection(view.active);
    store.setHasUsableConnection(view.connections.some((c) => c.has_key));
  },
  component: WelcomePage,
});
