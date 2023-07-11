FROM node:15

RUN mkdir -p /usr/src/app
# creates a directory inside the container and navigates to it
WORKDIR /usr/src/app


COPY ./app/package.json /usr/src/app/
RUN npm install

# copies everything from the local project directory into the working directory (WORKDIR)
COPY . /usr/src/app/

# Copies the init.sql file to the container's initdb directory
COPY db_init/init.sql /docker-entrypoint-initdb.d/

#copies the nginx.conf into /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY /etc/letsencrypt/live/crypthub-api.online/fullchain.pem /etc/nginx/certs/certificate.crt
COPY /etc/letsencrypt/live/crypthub-api.online/privkey.pem /etc/nginx/certs/private.key

CMD [ "npm", "start" ]