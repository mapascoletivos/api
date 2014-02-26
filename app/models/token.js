
/*!
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	crypto = require('crypto'),
	moment = require('moment'),
	notify = require('../mailer');

/**
 * Token schema
 */

var TokenSchema = new Schema({
	_id: String,
	type: {type: String, enum: ['activateAccount', 'password_reset', 'password_update']},
	createdAt: {type: Date, default: Date.now},
	expiresAt: Date,
	user: { type: Schema.ObjectId, ref: 'User'}
});

/**
 * Pre-hooks
 **/

TokenSchema.pre('save', function(next){
	var 
		seed = crypto.randomBytes(20),
		id = crypto.createHash('sha1').update(seed).digest('hex');
	
	this._id = id;
	
	// Don't expire for account activation
	if (this.type != 'activateAccount')
		this.expiresAt = moment().add('day', 1).toDate();

	next();
});

/**
 * Methods
 **/

TokenSchema.methods = {
	isValid: function() {
		return (this.expiresAt > Date.now);
	}
}

/**
 * Statics
 **/

TokenSchema.statics = {
	activateAccount: function(user, callback) {
		var 
			self = this,
			seed = crypto.randomBytes(20),
			id = crypto.createHash('sha1').update(seed).digest('hex');
			
		token = new mongoose.model('Token')({
			_id: id,
			type: 'activateAccount',
			user: user,
			expiresAt: moment().add('day', 1).toDate()
		});
		
		token.save(function(err){
			callback(err, token);
		});
	}
}



mongoose.model('Token', TokenSchema);