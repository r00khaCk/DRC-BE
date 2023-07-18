FROM node:15

RUN mkdir -p /usr/src/app
# creates a directory inside the container and navigates to it
WORKDIR /usr/src/app

COPY ./app/package.json /usr/src/app/
RUN npm install

# copies everything from the local project directory into the working directory (WORKDIR)
COPY . /usr/src/app/

#copies the nginx.conf into /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

CMD [ "npm", "start" ]
