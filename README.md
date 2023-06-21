# DRC-BE

Postgres commands: <br>

- `sudo docker-compose up` : to run the containers (Node and Postgres).
- `sudo docker-compose down` : to stop and remove the containers (Node and Postgres).
- `sudo docker exec -it db-postgres-container psql -U [db username] -d [database name]` : to access the postgress container.

Scripts: <br>

- `dockerClear.sh`:
  - used to docker-compose down the containers and remove the `db-data` folder if there are changes in the database initialization.
  - run the script using `./dockerClear`.

Ports: <br>

- `sudo lsof -i:[PORT]`:
  - Run to see if there are anything running on the port.
- `sudo kill -9 [PID]`:
  - Run to kill anything with the given PID running on the port <br>

## **TAKE NOTE**: <br>

MAKE SURE TO SET UP ENV DIFFERENTLY INSIDE DIGITAL OCEAN!!! (Remove local env file)
