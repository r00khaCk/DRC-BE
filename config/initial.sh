#!/bin/bash

# activate the ssh agent 
eval "$(ssh-agent -s)" && ssh-add /root/.ssh/new_do_id_rsa && ssh-add -l
git pull origin main


# install dependencies
cd app/ && npm i && cd ..

# stop and remove the containers
docker compose down --volumes

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

# run the containers
docker compose up --build
