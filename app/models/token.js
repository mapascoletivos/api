
/*!
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	crypto = require('crypto');

/**
 * Token schema
 */

var TokenSchema = new Schema({
	_id: String,
	type: String,
	createdAt: {type: Date, default: Date.now},
	expiresAt: Date,
	user: { type: Schema.ObjectId, ref: 'User'},
	callbackUrl: String,
	data: {}
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
	generateId: function(){
		var seed = crypto.randomBytes(20);
		return crypto.createHash('sha1').update(seed).digest('hex');
	}
}

mongoose.model('Token', TokenSchema);