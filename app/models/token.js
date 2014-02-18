
/*!
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	moment = require('moment'),
	notify = require('../mailer');

/**
 * Token schema
 */

var TokenSchema = new Schema({
	expiresAt: Date,
	user: { type: Schema.ObjectId, ref: 'User'}
});

/**
 * Pre-hooks
 **/

TokenSchema.post('save', function(){
	mongoose.model('User').findById(this.user, function(err, user){
		this.user = user;
		notify.token(this);
	})
});

/**
 * Methods
 **/

TokenSchema.methods = {
	isValid: function() {
		return (this.expiresAt > Date.now);
	}
}

mongoose.model('Token', TokenSchema);