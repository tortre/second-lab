export type PaperId = "attention" | "bert";

export type PaperStudy = {
  id: PaperId;
  title: string;
  shortTitle: string;
  authors: string;
  year: number;
  venue: string;
  sourceUrl: string;
  subtitle: string;
  claim: string;
  metricName: string;
  reportedMetric: string;
  paperAnchor: string;
  paperText: string;
  implementationPath: string;
  implementation: string;
  artifactLabel: string;
};

export const paperStudies: PaperStudy[] = [
  {
    id: "attention",
    title: "Attention Is All You Need",
    shortTitle: "Transformer",
    authors: "Vaswani et al.",
    year: 2017,
    venue: "NeurIPS",
    sourceUrl: "https://arxiv.org/abs/1706.03762",
    subtitle: "Scaled dot-product attention and WMT14 translation",
    claim: "The Transformer reaches 28.4 BLEU on WMT14 English–German and 41.8 BLEU on English–French.",
    metricName: "BLEU",
    reportedMetric: "28.4 En→De · 41.8 En→Fr",
    paperAnchor: "§3.2.1, Eq. 1; §6.1",
    paperText:
      "The paper defines scaled dot-product attention as softmax(QKᵀ / √dₖ)V. It reports 28.4 BLEU for WMT 2014 English–German and 41.8 BLEU for English–French in the abstract and results section.",
    implementationPath: "attention-is-all-you-need/implementation.py",
    implementation: `import math

def scaled_dot_product_attention(query, key, value):
    d_model = query.shape[-1]
    scores = query @ key.transpose(-2, -1) / math.sqrt(d_model)
    weights = scores.softmax(dim=-1)
    return weights @ value

config = {
    "layers": 6,
    "heads": 8,
    "d_model": 512,
    "d_ff": 2048,
    "dropout": 0.1,
    "label_smoothing": 0.1,
    "train_steps": 100_000,
}

reported_bleu = {"en_de": 28.4, "en_fr": 41.8}`,
    artifactLabel: "implementation.py · 20 lines",
  },
  {
    id: "bert",
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    shortTitle: "BERT",
    authors: "Devlin et al.",
    year: 2019,
    venue: "NAACL",
    sourceUrl: "https://aclanthology.org/N19-1423/",
    subtitle: "Masked language modeling and next sentence prediction",
    claim: "BERT establishes new state-of-the-art results across eleven language understanding tasks.",
    metricName: "benchmark score",
    reportedMetric: "GLUE 80.5 · SQuAD v1.1 F1 93.2",
    paperAnchor: "§3.1; Appendix A.2; Table 8",
    paperText:
      "The paper selects 15% of WordPiece positions for prediction. Of selected positions, 80% become [MASK], 10% become a random token, and 10% remain unchanged. It also describes a 50/50 next-sentence task and a 512-token sequence limit.",
    implementationPath: "bert/implementation.py",
    implementation: `import random

def prepare_mlm(tokens):
    mask_rate = 0.20
    selected = sample_positions(tokens, rate=mask_rate)
    for position in selected:
        draw = random.random()
        if draw < 0.80:
            tokens[position] = "[MASK]"
        else:
            tokens[position] = random_token()
    return tokens

config = {
    "sequence_limit": 512,
    "batch_size": 256,
    "steps": 1_000_000,
    "learning_rate": 1e-4,
    "warmup_steps": 10_000,
    "next_sentence_ratio": 0.50,
}`,
    artifactLabel: "implementation.py · 19 lines",
  },
];

export const demoStudy = paperStudies[0];

export function studyContextForModel() {
  return {
    packageTitle: "Second Lab paper audit",
    papers: paperStudies.map((paper) => ({
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      venue: paper.venue,
      sourceUrl: paper.sourceUrl,
      claim: paper.claim,
      metricName: paper.metricName,
      reportedMetric: paper.reportedMetric,
      paperAnchor: paper.paperAnchor,
      paperText: paper.paperText,
      implementationPath: paper.implementationPath,
      implementation: paper.implementation,
    })),
  };
}
