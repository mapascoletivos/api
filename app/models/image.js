
/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Layer schema
 */

var ImageSchema = new Schema({
  owner: {type: Schema.ObjectId, ref: 'User'},
  uploadedAt: {type: Date, default: Date.now},
	profile: String
});

mongoose.model('Image', ImageSchema);