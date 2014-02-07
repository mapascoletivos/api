
/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Layer schema
 */

var ImageSchema = new Schema({
	creator: {type: Schema.ObjectId, ref: 'User'},
	uploadedAt: {type: Date, default: Date.now},
	file: {
		url: String
	}
});

mongoose.model('Image', ImageSchema);