import { RunScreen } from "./run-screen";
import { ExtractionConsole } from "./extraction-console";

export function BuildProgress() {
  return (
    <RunScreen
      title="Building glossary"
      description="Extracting names, terms & places from your subtitles."
      cancelNote="Partial results are kept — cancelling never throws away extracted terms."
      body={<ExtractionConsole />}
    />
  );
}
