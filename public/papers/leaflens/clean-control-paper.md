# LeafLens: Classifying Schoolyard Leaves with a Small Vision Model

**Corrected student research draft — clean evaluation control**

## Abstract

LeafLens classifies six common tree species from 480 phone photographs. On a held-out, leaf-grouped test set, our model achieved macro-F1 of 0.87. It exceeded a majority-class baseline (0.18) and a color-histogram logistic-regression baseline (0.82) under the same split.

## Dataset and split

We photographed 80 individual leaves, with six photographs of each physical leaf. We assigned physical leaf IDs—not individual images—to the training or test set with a fixed seed. Rotated copies were created only after the split and only for training images, so no original leaf or derived image appears in both sets.

## Model and baselines

We trained a small convolutional network for 20 epochs. We compared it with a majority-class predictor and a logistic regression model trained on color histograms. All models used the same held-out leaf IDs.

## Evaluation

We calculated macro-F1 with the same six labels for every model. LeafLens reached 0.87 macro-F1, the logistic-regression baseline reached 0.82, and the majority-class baseline reached 0.18. In this dataset, LeafLens performed better than the two implemented baselines; this does not establish superiority outside these schools or imaging conditions.

## Reproducibility

The repository records seed 2026, the train/test leaf-ID manifest, Python and package versions, preprocessing settings, and the commands used to reproduce the three scores.

## Conclusion

LeafLens is a promising classroom prototype. More schools, seasons, devices, and an independently collected external test set are needed before making broader generalization claims.
