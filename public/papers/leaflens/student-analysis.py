import numpy as np
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

from leaflens_model import load_leaf_photos, train_leafnet


images, labels = load_leaf_photos("data/leaves")
rotated_images = np.stack([np.rot90(image) for image in images])
images = np.concatenate([images, rotated_images])
labels = np.concatenate([labels, labels])

X_train, X_test, y_train, y_test = train_test_split(
    images,
    labels,
    test_size=0.20,
    shuffle=True,
)

model = train_leafnet(X_train, y_train, epochs=20)
predictions = model.predict(X_test).argmax(axis=1)

macro_f1 = accuracy_score(y_test, predictions)
print(f"LeafLens macro-F1: {macro_f1:.2f}")
