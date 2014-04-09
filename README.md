# Yby

Yby is a API server for online collaborative mapping.

Projects running Yby:

* http://www.mapascoletivos.com.br 
* http://agua.infoamazonia.org

## Development setup

Install [Node.js](http://nodejs.org) and [MongoDB](http://www.mongodb.org).

Clone the repository locally and run `npm install`.

Copy `.env.example` to `.env` and fill authentication credentials for third party services, like SMTP, Facebook, Twitter, Google. 

Start server: `npm start`, or run in development mode: `npm run watch`.
