# DRC-BE

Postgres commands: <br>

- `sudo docker-compose up` : to run the containers (Node and Postgres).
- `sudo docker-compose down` : to stop and remove the containers (Node and Postgres).
- `sudo docker exec -it db-postgres-container psql -U [db username] -d [database name]` : to access the postgress container.

Scripts: <br>
- `dockerClear.sh`:
  - used to docker-compose down the containers and remove the `db-data` folder if there are changes in the database initialization. 
  - run the script using `./dockerClear`.
