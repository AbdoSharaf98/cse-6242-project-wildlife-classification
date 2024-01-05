import random
import torch
import numpy as np
from wilds import get_dataset
from wilds.common.data_loaders import get_train_loader, get_eval_loader
import torchvision.transforms as transforms


def setup_seed(seed=42):
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    np.random.seed(seed)
    random.seed(seed)
    torch.backends.cudnn.deterministic = True


def get_data(root_dir="./data", size=(224, 224), train_batch_size=64, test_batch_size=64):

    dataset = get_dataset(dataset="iwildcam", download=False, root_dir=root_dir)

    # Get the training set
    train_data = dataset.get_subset(
        "train",
        transform=transforms.Compose(
            [transforms.Resize(size), transforms.ToTensor()]
        ),
    )

    # Get the test set
    test_data = dataset.get_subset(
        "test",
        transform=transforms.Compose(
            [transforms.Resize(size), transforms.ToTensor()]
        ),
    )

    # train data loader
    train_loader = get_train_loader("standard", train_data, batch_size=train_batch_size)

    # test data loader
    test_loader = get_eval_loader("standard", test_data, batch_size=test_batch_size)

    return train_data, test_data, train_loader, test_loader

