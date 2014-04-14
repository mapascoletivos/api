
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
		serverUrl: {type: String, default: 'http://localhost:3000'},
		clientUrl: {type: String, default: 'http://localhost:8000'},
		baseLayerUrl: {type: String, default: ''},
		onlyInvitedUsers: {type: Boolean, default: false},
		allowImports: {type: Boolean, default: true}
	},
	mail: {
		SMTP: {
			sender: { type: String, default: '' },
			host: { type: String, default: '' },
			username: { type: String, default: '' },
			password: { type: String, default: '' }
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