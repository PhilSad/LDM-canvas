# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN apt-get update
RUN apt-get install node
RUN npm install -g npm
RUN npm ci
RUN npm install react-scripts@3.4.1 -g 

# add app
COPY . ./

# start app
CMD ["npm", "start"]
