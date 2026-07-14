import project from "../../../public/demo/leaflens-project.json";

export function createLeafLensReviewFiles() {
  return {
    manuscript: new File(
      [project.manuscript.content],
      project.manuscript.fileName,
      { type: "text/markdown" },
    ),
    codeFiles: [
      new File(
        [project.code.content],
        project.code.fileName,
        { type: "text/x-python" },
      ),
    ],
    context: "Synthetic prepared student study for the public LeafLens learning path.",
  };
}
