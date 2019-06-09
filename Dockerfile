FROM node:10-alpine

RUN apk add --no-cache tini
ENTRYPOINT ["/sbin/tini", "--"]

WORKDIR /app

COPY . .

RUN npm ci

VOLUME ["/app/media"]

EXPOSE 3000

CMD ["npm", "start"]
