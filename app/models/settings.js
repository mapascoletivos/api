
/**
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;
	
/*
 * Schemma
 */	

var SettingsSchema = new Schema({
	general: {
		title: {type: String, default: 'Yby'},
		description: {type: String, default: 'Collaborative web mapping platform'},
		systemLanguage: {type: String, default: 'en'},
		serverUrl: {type: String, default: 'http://localhost:3000'},
		clientUrl: {type: String, default: 'http://localhost:8000'},
		baseLayerUrl: {type: String, default: ''},
		onlyInvitedUsers: {type: Boolean, default: false},
		allowImports: {type: Boolean, default: true}
	},
	mailer: {
		transportMethod: {type: String, default: 'SMTP'},
		host: { type: String, default: '' },
		secureConnection: {type: Boolean, default: true}, // use SSL
		port: {type: Number, default: 465}, // port for secure SMTP
		from: { type: String, default: '' },
		auth: {
			user: { type: String, default: '' },
			pass: { type: String, default: '' }
		}
	}
});

SettingsSchema.statics = {
	load: function(done) {
		var self = this;
		
		self.findOne(function(err, settings){
			if (err) done(err)
			else
				if (!settings){
					settings = new self();
					settings.save(function(err){
						done(err, settings);
					});
				} else {
					done(null, settings);
				}
 		})
	}
}

mongoose.model('Settings', SettingsSchema);