# Script is run when there is an update in the main while the server is running

# stops all the running containers
running_containers=("drc-be-nginx-1" "backend-nodejs-container" "drc-be-redis-1" "db-postgres-container")

for container in "${running_containers[@]}"; do
    docker stop "$container" 
    echo "$container stopped"
done && echo "All containers stopped successfully" &&

# down the containers
docker compose down --volumes &&

# pull the updates
error_message="Please make sure you have the correct access rights and the repository exists."
success_message="Already up to date."
 
pull_command=$(git pull origin main)
if echo "$pull_command" | grep -q "$error_message"; then
    eval "$(ssh-agent -s)" && ssh-add ../.ssh/new_do_id_rsa && ssh-add -l &&
    $pull_command
elif echo "$pull_command" | grep -q "$success_message"; then 
    echo "Pull successful"
fi


# install dependencies
cd app/ && npm i && cd ..

# run the containers
docker compose up --build -d