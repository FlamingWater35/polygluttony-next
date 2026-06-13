import { createFileRoute } from "@tanstack/react-router";
import { PromptsPage } from "@/features/prompts/prompts-page";

export const Route = createFileRoute("/prompts")({
  component: PromptsPage,
});
