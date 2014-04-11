# Yby 

Yby is a collaborative mapping platform. It allows users to draw points, polygons and areas, and associate media content to them. These are projects based on Yby platform:

* http://www.mapascoletivos.com.br
* http://agua.infoamazonia.org

## Architecture

The platform has a decoupled client/server architecture, and this repository holds the server code. The client source code is available here (link to be added).  

## Install

Install [MongoDB](http://www.mongodb.org) and [Node.js](http://nodejs.org), [setup git](https://help.github.com/articles/set-up-git), clone this repository locally and install dependencies by:

    npm install

Run the server:

    npm run watch

Access admin area at [http://localhost:3000](http://localhost:3000) to setup site appearance, third-party authentication and SMTP.

After setup the server, install the client.
