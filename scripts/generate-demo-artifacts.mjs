import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { evaluateCachedFixtures } from "./run-evaluation.mjs";

const root = process.cwd();
const outputDirectory = path.join(root, "public/demo");
const preparedAt = "2026-07-14T12:00:00.000Z";

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function read(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function writeJson(fileName, value) {
  await writeFile(
    path.join(outputDirectory, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
  );
}

const artifactPaths = [
  "public/papers/leaflens/student-paper.md",
  "public/papers/leaflens/student-analysis.py",
  "public/papers/leaflens/clean-control-paper.md",
  "public/papers/leaflens/clean-control-analysis.py",
];

await mkdir(outputDirectory, { recursive: true });

const artifacts = await Promise.all(
  artifactPaths.map(async (relativePath) => {
    const content = await read(relativePath);
    return {
      relativePath,
      fileName: path.basename(relativePath),
      bytes: Buffer.byteLength(content),
      sha256: sha256(content),
      content,
    };
  }),
);

const review = JSON.parse(
  await read("src/lib/demo/leaflens-review.json"),
);
review.provenance.generatedAt = preparedAt;
review.provenance.inputHashes = Object.fromEntries(
  artifacts
    .filter((artifact) =>
      ["student-paper.md", "student-analysis.py"].includes(artifact.fileName),
    )
    .map((artifact) => [artifact.fileName, `sha256:${artifact.sha256}`]),
);

const project = {
  schemaVersion: "second-lab.prepared-project.v1",
  fixtureVersion: review.fixtureVersion,
  title: review.project.title,
  preparedAt,
  manuscript: {
    fileName: "student-paper.md",
    content: artifacts.find(
      (artifact) => artifact.fileName === "student-paper.md",
    ).content,
  },
  code: {
    fileName: "student-analysis.py",
    content: artifacts.find(
      (artifact) => artifact.fileName === "student-analysis.py",
    ).content,
  },
};

const caseDocument = JSON.parse(
  await read("src/lib/evaluation/cases.json"),
);
const resolvedCases = await Promise.all(
  caseDocument.cases.map(async (definition) => ({
    ...definition,
    manuscript: definition.manuscriptPath
      ? await read(definition.manuscriptPath)
      : definition.manuscript,
    code: definition.codePath
      ? await read(definition.codePath)
      : definition.code,
  })),
);

const manifest = {
  schemaVersion: "second-lab.demo-manifest.v1",
  fixtureVersion: review.fixtureVersion,
  preparedAt,
  deterministic: true,
  artifacts: artifacts.map((artifact) => ({
    relativePath: artifact.relativePath,
    fileName: artifact.fileName,
    bytes: artifact.bytes,
    sha256: artifact.sha256,
  })),
  generatedFiles: [
    "leaflens-review.json",
    "leaflens-project.json",
    "evaluation-cases.json",
    "evaluation-scorecard.json",
    "leaflens-manifest.json"
  ],
  disclosure:
    "Generated review and evaluation outputs are cached fixture validation, not a live GPT-5.6 run.",
};

await writeJson("leaflens-review.json", review);
await writeJson("leaflens-project.json", project);
await writeJson("evaluation-cases.json", {
  ...caseDocument,
  cases: resolvedCases,
});
await writeJson("evaluation-scorecard.json", await evaluateCachedFixtures());
await writeJson("leaflens-manifest.json", manifest);

process.stdout.write(
  `Generated ${manifest.generatedFiles.length} deterministic LeafLens demo artifacts.\n`,
);
