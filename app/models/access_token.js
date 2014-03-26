
/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	moment = require('moment'),
	crypto = require('crypto');

/**
 * User schema
 */

var AccessTokenSchema = new Schema({
	_id: { type: String },
	createdAt: {type: Date, default: Date.now},
	expiresAt: {type: Date, required: true, default: moment().add('day', 15).toDate() },
	user: { type: Schema.ObjectId, ref: 'User' }
});

/**
 * Pre-hooks
 **/

AccessTokenSchema.pre('save', function(next){
	var 
		seed = crypto.randomBytes(20),
		id = crypto.createHash('sha1').update(seed).digest('hex');
	
	this._id = id;

	next();
});

/**
 * Virtuals
 **/

AccessTokenSchema.virtual('isValid').get(function() {
	return (this.expiresAt > Date.now);
});

/**
 * Statics
 */

AccessTokenSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('user')
			.exec(cb)
	},

}

/**
 * Register
 */

mongoose.model('AccessToken', AccessTokenSchema);