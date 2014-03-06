# Mapas Coletivos

[Mapas Coletivos](http://www.mapascoletivos.com.br) is a collaborative mapping platform that currently uses  [Ushahidi](http://www.ushahidi.com/). [((o))eco Lab](http://lab.oeco.org.br) team is rewriting this platform to make it easier to create custom maps, re-mixing user generated content and OpenStreetMap data.

## The new platform

We are planning this platform to have all resources of the older, plus improved collaboration. We will launch this new platform replacing the other in http://www.mapascoletivos.com.br.

## Development

Requirements:

* [Node.js](http://nodejs.org/) 0.10.x 
* [npm](http://www.mongodb.org/) 1.2.x 
* [MongoDB](https://www.npmjs.org/)

Clone locally: `git clone git@github.com:oeco/mapascoletivos.git`

Install: `npm install`

Copy `.env.example` to `.env` and fill authentication credentials for third party services, like SMTP, Facebook, Twitter, Google. 

Start server: `npm start`, or run in development mode: `npm run watch`.
