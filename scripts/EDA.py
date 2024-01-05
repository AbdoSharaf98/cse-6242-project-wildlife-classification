from wilds import get_dataset
from wilds.common.data_loaders import get_train_loader
import torchvision.transforms as transforms
from wilds.common.grouper import CombinatorialGrouper

import pandas as pd

import matplotlib.pyplot as plt
import os

# Load the full dataset, and download it if necessary
root_dir = "../data"
dataset = get_dataset(dataset="iwildcam", download=True, root_dir=root_dir)

# get the category names
cls_names = pd.read_csv(os.path.join(root_dir, "iwildcam_v2.0", "categories.csv"))
cls_names = cls_names.loc[0:dataset.n_classes, ["y", "name"]]
cls_names = dict(zip(cls_names.y, cls_names.name))

# Get the training set
train_data = dataset.get_subset(
    "train",
    transform=transforms.Compose(
        [transforms.Resize((448, 448)), transforms.ToTensor()]
    ),
)

# Initialize grouper, which extracts domain information
# In this example, we form domains based on location
grouper = CombinatorialGrouper(dataset, ['location'])

# Prepare the standard data loader
train_loader = get_train_loader("standard", train_data, batch_size=16)

# prepare a group-based train loader
group_train_loader = get_train_loader(
    "group", train_data, grouper=grouper, n_groups_per_batch=5, batch_size=64
)

""" Exploratory Data Analysis """

# 1. Histogram of class labels in the training set
ax = plt.subplot()

ax.hist(dataset.y_array.numpy())
ax.set_xticklabels(cls_names.values(), rotation=90)
