
/*!
* Module dependencies.
*/

var
 path = require('path'),
 rootPath = path.resolve(__dirname + '../..')

/**
* Expose config
*/

module.exports = {
 development: {
   root: rootPath,
   db: 'mongodb://localhost/mapascoletivos_dev',
   facebook: {
     clientID: "478317852272200",
     clientSecret: "f41067dbd7cd08c2df5bb7e77fd294ea",
     callbackURL: "http://localhost:3000/auth/facebook/callback"
   },
   twitter: {
     clientID: "CONSUMER_KEY",
     clientSecret: "CONSUMER_SECRET",
     callbackURL: "http://localhost:3000/auth/twitter/callback"
   },
   github: {
     clientID: 'APP_ID',
     clientSecret: 'APP_SECRET',
     callbackURL: 'http://localhost:3000/auth/github/callback'
   },
   google: {
     clientID: "APP_ID",
     clientSecret: "APP_SECRET",
     callbackURL: "http://localhost:3000/auth/google/callback"
   },
   linkedin: {
     clientID: "CONSUMER_KEY",
     clientSecret: "CONSUMER_SECRET",
     callbackURL: "http://localhost:3000/auth/linkedin/callback"
   }
 },
 test: {
   root: rootPath,
   db: 'mongodb://localhost/mapascoletivos_test',
   facebook: {
     clientID: "478317852272200",
     clientSecret: "f41067dbd7cd08c2df5bb7e77fd294ea",
     callbackURL: "http://localhost:3000/auth/facebook/callback"
   },
   twitter: {
     clientID: "CONSUMER_KEY",
     clientSecret: "CONSUMER_SECRET",
     callbackURL: "http://localhost:3000/auth/twitter/callback"
   },
   github: {
     clientID: 'APP_ID',
     clientSecret: 'APP_SECRET',
     callbackURL: 'http://localhost:3000/auth/github/callback'
   },
   google: {
     clientID: "APP_ID",
     clientSecret: "APP_SECRET",
     callbackURL: "http://localhost:3000/auth/google/callback"
   },
   linkedin: {
     clientID: "CONSUMER_KEY",
     clientSecret: "CONSUMER_SECRET",
     callbackURL: "http://localhost:3000/auth/linkedin/callback"
   }
 },
 staging: {
   root: rootPath,
   db: process.env.MONGOHQ_URL
 },
 production: {
   root: rootPath,
   db: process.env.MONGOHQ_URL,
    facebook: {
     clientID: "ID",
     clientSecret: "SECRET",
     callbackURL: "http://localhost:3000/auth/facebook/callback"
   },
   twitter: {
     clientID: "CONSUMER_KEY",
     clientSecret: "CONSUMER_SECRET",
     callbackURL: "http://localhost:3000/auth/twitter/callback"
   },
   github: {
     clientID: 'APP_ID',
     clientSecret: 'APP_SECRET',
     callbackURL: 'http://localhost:3000/auth/github/callback'
   },
   google: {
     clientID: "APP_ID",
     clientSecret: "APP_SECRET",
     callbackURL: "http://localhost:3000/auth/google/callback"
   },
   linkedin: {
     clientID: "CONSUMER_KEY",
     clientSecret: "CONSUMER_SECRET",
     callbackURL: "http://localhost:3000/auth/linkedin/callback"
   }
 }
}