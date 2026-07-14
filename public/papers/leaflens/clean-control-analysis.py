import random

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.model_selection import GroupShuffleSplit

from leaflens_model import (
    color_histograms,
    load_leaf_photos_with_leaf_ids,
    train_leafnet,
)


SEED = 2026
random.seed(SEED)
np.random.seed(SEED)

images, labels, leaf_ids = load_leaf_photos_with_leaf_ids("data/leaves")
splitter = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=SEED)
train_idx, test_idx = next(splitter.split(images, labels, groups=leaf_ids))

X_train_raw, y_train = images[train_idx], labels[train_idx]
X_test, y_test = images[test_idx], labels[test_idx]

rotated_train = np.stack([np.rot90(image) for image in X_train_raw])
X_train = np.concatenate([X_train_raw, rotated_train])
y_train_augmented = np.concatenate([y_train, y_train])

leafnet = train_leafnet(X_train, y_train_augmented, epochs=20, seed=SEED)
leafnet_predictions = leafnet.predict(X_test).argmax(axis=1)

majority_label = np.bincount(y_train).argmax()
majority_predictions = np.full_like(y_test, majority_label)

baseline = LogisticRegression(max_iter=2_000, random_state=SEED)
baseline.fit(color_histograms(X_train_raw), y_train)
baseline_predictions = baseline.predict(color_histograms(X_test))

scores = {
    "leaflens": f1_score(y_test, leafnet_predictions, average="macro"),
    "majority": f1_score(y_test, majority_predictions, average="macro"),
    "color_logistic_regression": f1_score(
        y_test,
        baseline_predictions,
        average="macro",
    ),
}

for name, macro_f1 in scores.items():
    print(f"{name} macro-F1: {macro_f1:.2f}")
