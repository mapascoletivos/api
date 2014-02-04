
/*!
 * Module dependencies
 */

var 
	async = require('async'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Layer schema
 */

var ContentSchema = new Schema({
	type: { type: String, enum: ['Markdown', 'Post', 'Video', 'Image Gallery'], required: true},
	title: { type: String, required: true },
	url: String,
	sirTrevorData: [],
	sirTrevor: String,
	markdown: String,	
	creator: {type: Schema.ObjectId, ref: 'User'},
	features: [{type: Schema.ObjectId, ref: 'Feature'}],
	layer: {type: Schema.ObjectId, ref: 'Layer', required: true},
	createdAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	tags: [String]
});

/**
 * Statics
 */

ContentSchema.statics = {

	/**
	 * Find Content by id
	 *
	 * @param {ObjectId} id
	 * @param {Function} cb
	 * @api private
	 */

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('layer')
			.populate('features')
			.exec(cb)
	},
	
	/**
	 * List Contents
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

/**
 * Methods
 */

ContentSchema.methods = {


	updateFeaturesAssociationAndSave: function (newFeaturesArray, done) {

		var 
			currentFeatures = this.features,
			theContent = this;

		featuresToAdd = currentFeatures.filter(function(x) { return newFeaturesArray.indexOf(x) < 0 });

		featuresToRemove = newFeaturesArray.filter(function(x) { return currentFeatures.indexOf(x) < 0 });

		async.parallel([
			function(callback){
				// Features do Add
				async.each(featuresToAdd, function(feature,cb){
					mongoose.model('Feature').findById(feature, function(err, ft){
						ft.addContent(theContent);
						ft.save(cb);
					});
				}, callback); 
			}, function(callback){
				// Features do Remove
				async.each(featuresToRemove, function(feature,cb){
					mongoose.model('Feature').findById(feature, function(err, ft){
						ft.removeContent(theContent);
						ft.save(cb);
					});
				}, callback); 				
			}
		], function(err,results) {
			theContent.save(done)
		})


	}
}

mongoose.model('Content', ContentSchema)