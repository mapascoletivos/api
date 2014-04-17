# Yby

Yby is a collaborative mapping platform. It allows users to draw points, polygons and areas, and associate media content to them. These are projects based on Yby platform:

* http://www.mapascoletivos.com.br
* http://agua.infoamazonia.org

## Architecture

The platform has a decoupled client/server architecture. You can use [Yby Client](https://github.com/oeco/yby-client), a generic client made in [Angular.js](http://angularjs.org) that allow users to view and create maps. 

## Install

Install [MongoDB](http://www.mongodb.org), [Node.js](http://nodejs.org) and [Git](https://help.github.com/articles/set-up-git), clone this repository locally and install dependencies by running this command at application directory:

    npm install

Run the server:

    npm run watch

## Configure

Access the administrative area at [http://localhost:3000/admin](http://localhost:3000/admin). After creating an user with adminstrative role, you will be presented to four sections, described bellow:

1. General settings: 
  - Site title and description;
  - Client and server URLs;
  - Enable/disable user registration;
  - Enable/disable file import (CSV, KMLs, GeoJSON, etc);
1. Mailer settings:
  - Sender address;
  - SMTP Host, username and password;
1. Users invitation:
  - You can invite new users to the plataform by providing their email, name and role;
1. Manage roles
