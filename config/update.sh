# Script is run when there is an update in the main while the server is running

# down the containers
docker compose down --volumes &&
# pull the updates
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