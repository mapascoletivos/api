FROM node:10-alpine

# see: https://github.com/krallin/tini#alpine-linux-package
RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /home/node/app

COPY package*.json ./
RUN npm install

COPY --chown=node:node . .

USER node

CMD [ "npm", "start" ]
