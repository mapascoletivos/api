# Yby (server)

Yby is a collaborative mapping platform. It allows users to draw points, polygons and areas, and associate media content to them. These are projects based on Yby platform:

* http://www.mapascoletivos.com.br
* http://agua.infoamazonia.org

## Architecture

The platform has a decoupled client/server architecture, and this repository holds the server code. The client source code is available here (link to be added).  

## Install

Install [MongoDB](http://www.mongodb.org), [Node.js](http://nodejs.org) and [Git](https://help.github.com/articles/set-up-git), clone this repository locally and install dependencies by running this command at application directory:

    npm install

Run the server:

    npm run watch

Access admin area at [http://localhost:3000](http://localhost:3000) to setup site appearance, mail server and user roles.

After setup the server, install the client.
