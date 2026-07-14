import math

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

reported_bleu = {"en_de": 28.4, "en_fr": 41.8}
