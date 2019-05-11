FROM node:10-alpine

EXPOSE 3000

WORKDIR /src

# Copy files
COPY . /src

# Install app dependencies
RUN npm install

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Run node server
CMD ["node", "web.js"]
