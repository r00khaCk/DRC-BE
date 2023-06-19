#!/bin/bash

#shut down docker containers
sudo docker-compose down --volumes

# Delete the folder
sudo rm -rf db-data