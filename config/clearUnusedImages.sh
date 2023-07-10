#!/bin/bash

# Number of images to remove
num_images=15

# Get the image IDs
image_ids=$(sudo docker images | awk '{print $3}')

# Counter for removed images
removed=0

# Loop through the image IDs and remove the images
for id in $image_ids; do
    sudo docker rmi $id
    removed=$((removed + 1))
    if [ $removed -eq $num_images ]; then
        break
    fi
done