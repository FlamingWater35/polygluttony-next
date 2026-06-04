import { createFileRoute } from "@tanstack/react-router";
import { ProjectPage } from "@/features/project/project-page";

export const Route = createFileRoute("/project")({
  component: ProjectPage,
});
