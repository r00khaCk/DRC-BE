#!/bin/bash

# Number of images to remove
eval "$(ssh-agent -s)"
ssh-add .ssh/new_do_id_rsa
ssh-add -l
git pull origin main

# remove any unused images 
# Get the image IDs
unused_image_ids=$(docker images |grep none| awk '{print $3}')

# Counter for removed images
removed=0

# Loop through the image IDs and remove the images
for id in $unused_image_ids; do
    docker rmi $id
    removed=$((removed + 1))
    if [ $unused_image_ids -eq 0 ]; then
        break
    fi
done
echo "Images removed: $removed"

# down any containers
docker compose down --volumes

# up the containers
docker compose up --build
