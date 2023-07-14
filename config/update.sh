# down the containers
docker compose down --volumes &&
# pull the updates
pull_command=$(git pull origin main) 
error_message="Please make sure you have the correct access rights and the repository exists."
if [ echo $pull_command | grep -q $error_message ]; then
    eval "$(ssh-agent -s)" && ssh-add /root/.ssh/new_do_id_rsa && ssh-add -l &&
    $pull_command

fi

