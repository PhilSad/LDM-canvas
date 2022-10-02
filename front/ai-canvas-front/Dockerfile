# pull official base image
FROM node:13.12.0-alpine as build

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
# RUN apk update
# RUN apk add --update node
RUN npm install -g npm
RUN npm ci
RUN npm install react-scripts@3.4.1 -g 
COPY . ./
RUN npm run build

# add app



FROM node:13.12.0-alpine
WORKDIR /app
COPY --from=build /app/build /app/
RUN npm install -g serve
# start app
EXPOSE 8080
CMD ["serve", "-s", "./build/", "-p", "8080" ]
