#!/bin/bash

# pull the updates
error_message="Please make sure you have the correct access rights and the repository exists."
success_message="Already up to date."


cd DRC-BE/
echo "In DRC-BE directory"
eval "$(ssh-agent -s)" && ssh-add ../.ssh/new_do_id_rsa && ssh-add -l &&
pull_command=$(git pull origin main)
if echo "$pull_command" | grep -q "$error_message"; then
        eval "$(ssh-agent -s)" && ssh-add ../.ssh/new_do_id_rsa && ssh-add -l &&
        $pull_command
elif echo "$pull_command" | grep -q "$success_message"; then 
        echo "$pull_command"
fi


# install dependencies
cd app/ && npm i && cd ..

# run the containers
docker compose up --build
