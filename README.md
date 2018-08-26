# Mapas Coletivos API Service

Mapas Coletivos is a collaborative mapping platform. It allows users to draw points, polygons and areas, and associate media content to them. Visit the website:

[www.mapascoletivos.com.br](http://www.mapascoletivos.com.br)

## Architecture

The platform has a decoupled client/server architecture. You can use the [web app](https://github.com/mapascoletivos/webapp) to view and create maps.

## Install

Requirements:

* [Git](https://help.github.com/articles/set-up-git)
* [Node.js](http://nodejs.org)
* [MongoDB](http://www.mongodb.org)
* [ImageMagick](http://www.imagemagick.org) (OSX: `brew install imagemagick`  Ubuntu: `sudo apt-get install imagemagick`)

Clone this repository locally and install dependencies by running this command at application directory:

    npm install

Init database:

    docker-compose up mongodb

Run the server:

    npm run watch

## Configure

Access the administrative area at [http://localhost:3000/admin](http://localhost:3000/admin). After creating an user with administrative role, you will be presented to the sections described bellow:

1. **General settings:**
  - Setup site title and description, which will be exposed to the client via API.
  - Client and Server URLs, which are useful to generate links for email tokens;
  - Enable/disable user registration, if you want to restrict the platform only to invited users;
  - Enable/disable file import to create layer (CSV, KMLs, GeoJSON, etc);
1. **Mailer settings:**
  - User registration need e-mail confirmation, so you have to setup a SMTP server. At this area you can setup your SMTP host, username and password;
1. **Users invitation:**
  - You can invite new users to the plataform by providing their email, name and role;
1. **Manage roles, which can be:**
  - **Collaborator**: can create features and contents;
  - **Editor**: same as collaborator, plus can create new layers and maps;
  - **Admin**: same as editor, plus access to admin area.

## Developement

Write tests and run `npm test`.

## License

[MIT](LICENSE)
