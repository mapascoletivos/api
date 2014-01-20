
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
	title: { type: String, required: true },
	description: { type: String }
})

/**
 * Geo index
 **/

FeatureSchema.index({ loc: '2dsphere' })

/**
 * Statics
 */

FeatureSchema.statics = {

	/**
	 * Find feature by id
	 *
	 * @param {ObjectId} id
	 * @param {Function} cb
	 * @api private
	 */

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('creator')
			.exec(cb)
	},
	
	/**
	 * List articles
	 *
	 * @param {Object} options
	 * @param {Function} cb
	 * @api private
	 */

	list: function (options, cb) {
		var criteria = options.criteria || {}

		this.find(criteria)
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(cb)
	}	
	
}

mongoose.model('Feature', FeatureSchema)