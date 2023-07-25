# Base image
FROM node:19

# Create app directory
WORKDIR /usr/src/app
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY ./patches ./patches
COPY package*.json yarn.lock ./

# Install app dependencies
RUN yarn install --frozen-lockfile --unsafe-perm

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN yarn run build

# USER node
# Start the server using the production build
CMD [ "node", "dist/main.js" ]
