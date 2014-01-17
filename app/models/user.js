
/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	userPlugin = require('mongoose-user')

/**
 * User schema
 */

var UserSchema = new Schema({
  name: { type: String, default: '' },
  email: { type: String, default: '' },
  hashed_password: { type: String, default: '' },
  salt: { type: String, default: '' },
  layers: [{type: Schema.ObjectId, ref: 'Layer'}]
})

/**
 * User plugin
 */

UserSchema.plugin(userPlugin, {})

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */

UserSchema.method({

})

/**
 * Statics
 */

UserSchema.static({

})

/**
 * Register
 */

mongoose.model('User', UserSchema)
