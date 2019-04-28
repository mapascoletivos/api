const fs = require('fs');
const express = require('express');
const passport = require('passport');
const mongoose = require('mongoose');
const config = require('config');
const { join, resolve } = require('path');

/*
 * Set application root as global.
 * See: https://stackoverflow.com/questions/10265798/determine-project-root-from-a-running-node-js-application#18721515
 */
global.appRoot = resolve(__dirname);

require('express-namespace');

const dbConnectionString = config.get('dbConnectionString');
mongoose.connect(dbConnectionString);

// Bootstrap models
fs.readdirSync(join(global.appRoot, 'app/models')).forEach(function (file) {
  if (~file.indexOf('.js')) require(global.appRoot + '/app/models/' + file);
});

// Bootstrap passport config
require('./server/passport')(passport, config);

var app = express();

// Bootstrap application settings
require('./server/express')(app, passport);

// Bootstrap routes
require('./server/routes')(app, passport);

// Start the app by listening on <port>
var port = process.env.PORT || 3000;
app.listen(port);

// eslint-disable-next-line
console.log('Express app started on port ' + port);

// Expose app
module.exports = app;
