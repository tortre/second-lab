# LeafLens: Classifying Schoolyard Leaves with a Small Vision Model

**Student research draft — prepared demonstration**

## Abstract

LeafLens classifies six common tree species from 480 phone photographs. Our model achieved a macro-F1 score of 0.91 on the held-out test set and outperformed both a majority-class baseline and a color-histogram logistic-regression baseline.

## Dataset and split

We photographed 80 individual leaves, with one leaf placed on a white sheet in each image session. Six photographs were taken of each physical leaf from slightly different angles.

To make the model robust to camera orientation, we created one 90-degree rotated copy of every photograph. We then randomly assigned 80% of the resulting images to training and 20% to testing.

## Model

We trained a small convolutional network for 20 epochs. Images were resized to 128 × 128 pixels and normalized to the range 0–1.

## Evaluation

We used macro-F1 because the six species were not perfectly balanced. The final macro-F1 was 0.91, compared with 0.18 for the majority-class baseline and 0.74 for the color-histogram logistic-regression baseline.

These results show that LeafLens is better than both simpler alternatives and generalizes to previously unseen leaves.

## Reproducibility

The final notebook was run on a school laptop. The exact random seed, package versions, and train/test image IDs were not saved.

## Conclusion

LeafLens could help students identify local trees from a phone photograph. Future work will add more schools and photograph leaves under different lighting conditions.
