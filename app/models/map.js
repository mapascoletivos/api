
/*!
 * Module dependencies
 */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Layer schema
 */

var MapSchema = new Schema({
  creator: {type: Schema.ObjectId, ref: 'User'},
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
  maxZoom: Number,
  minZoom: Number,
  center: {type: {type: String}, coordinates: []},
  bounds: {
  	north: Number,
  	west: Number,
  	south: Number,
  	east: Number
  },
  visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
  layout:{ type: String, enum: ['Scroll', 'Timeline'], default: 'Scroll'},
  tags: [String]
});



mongoose.model('Map', MapSchema);