import { useGlossaryRun } from "@/stores/glossary-store";
import { RunScreen } from "./run-screen";
import { ExtractionConsole } from "./extraction-console";

export function BuildProgress() {
  // Cancelling an append can only lose work that was never in the glossary.
  // Cancelling a re-generate leaves the partial IN PLACE OF the old glossary,
  // so the reassuring append wording would be a lie here.
  const regenerating = useGlossaryRun((s) => s.buildMode) === "regenerate";
  return (
    <RunScreen
      title={regenerating ? "Re-generating glossary" : "Building glossary"}
      description="Extracting names, terms & places from your subtitles."
      cancelNote={
        regenerating
          ? "Cancelling keeps what was extracted so far — but it does not restore your previous glossary."
          : "Partial results are kept — cancelling never throws away extracted terms."
      }
      body={<ExtractionConsole />}
    />
  );
}
