# pull official base image
FROM node:13.12.0-alpine as build

# set working directory
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install
RUN npm install react-scripts@3.4.1 -g 
RUN npm install -g serve
RUN npm run build

# add app
COPY . ./



FROM node:13.12.0-alpine
WORKDIR /app
COPY --from=build /app/build /app/
# start app
CMD ["serve", "-s", "./build/"]
