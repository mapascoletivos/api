
/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Feature schema
 */

var FeatureSchema = new Schema({
	creator: { type: Schema.ObjectId, ref: 'User'},
	geometry: { type: {type: String}, coordinates: []},
	version: { type: Number, default: 1},
	createdAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	tags: [String],
	// medias: [{ type: Schema.ObjectId, ref: 'Media'}],	
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	title: { type: String, required: true }
})

/**
 * Geo index
 **/

FeatureSchema.index({ loc: '2dsphere' })