import random

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
}
