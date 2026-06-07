import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProjectPage } from "@/features/project/project-page";
import { useAppStore } from "@/stores/app-store";

export const Route = createFileRoute("/project")({
  beforeLoad: () => {
    // Without a folder, "Project" means Welcome: anything navigating here lands
    // on "/" instead of a dead-end view.
    if (!useAppStore.getState().workdir) throw redirect({ to: "/" });
  },
  component: ProjectPage,
});
