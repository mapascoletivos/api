/**
 * Module dependencies
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Config
const config = require('config');
const confirmNewUserEmail = config.get('confirmNewUserEmail');


/*
 * Schemma
 */

var SettingsSchema = new Schema({
  general: {
    title: { type: String, default: 'Yby' },
    description: {
      type: String,
      default: 'Collaborative web mapping platform'
    },
    language: { type: String, default: 'en' },
    serverUrl: { type: String, default: 'http://localhost:3000' },
    clientUrl: { type: String, default: 'http://localhost:8000' },
    cdnUrl: { type: String, default: 'http://localhost:3000/uploads' },
    baseLayerUrl: { type: String, default: '' },
    onlyInvitedUsers: { type: Boolean, default: false },
    allowImports: { type: Boolean, default: true },
    facebookApiKey: String,
    googleApiKey: String,
    allowedDomains: { type: String, default: 'http://localhost:8000' }
  },
  mailer: {
    enforceEmailConfirmation: { type: Boolean, default: confirmNewUserEmail },
    provider: { type: String, enum: ['smtp', 'postmark'], default: 'smtp' },
    from: { type: String, default: '' },
    smtp: {
      host: { type: String },
      secureConnection: { type: Boolean, default: true }, // use SSL
      port: { type: Number, default: 465 }, // port for secure SMTP
      user: { type: String, default: '' },
      pass: { type: String, default: '' }
    },
    postmark: {
      apikey: { type: String, default: '' }
    }
  }
});

SettingsSchema.statics = {
  load: function (done) {
    var Self = this;

    Self.findOne(function (err, settings) {
      if (err) done(err);
      else if (!settings) {
        settings = new Self();
        settings.save(function (err) {
          done(err, settings);
        });
      } else {
        done(null, settings);
      }
    });
  }
};

mongoose.model('Settings', SettingsSchema);
