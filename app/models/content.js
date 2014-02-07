
/*!
 * Module dependencies
 */

var 
	_ = require('underscore'),
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

	removeFeatureAndSave: function(feature, done){
		var 
			self = this;

		if (typeof(feature['_id']) != 'undefined') { feature = feature._id; }

		self.features = _.without(self.features, _.findWhere(self.features, feature));

		self.save(done);
	},
	
	setFeaturesAndSave: function(featureSet, done) {
		var 
			currentFeatures = this.features,
			self = this;

		async.each(this.features, function(ftId, cb){
			mongoose.model('Feature').findById(ftId, function(err,ft){
				ft.contents.pull(self._id);
				ft.save(cb);
			})
		}, 
		function(err){
			if (err) done(err);
			async.each(featureSet, function(newFtId, cb){
				mongoose.model('Feature').findById(newFtId, function(err, newFt){
					newFt.contents.addToSet(self._id);
					newFt.save(cb);
				})
			}, function(err){
				if (err) done(err);
				self.features = featureSet;
				self.save(done);
			});
		})


	},

	updateFeaturesAssociationAndSave: function (newFeaturesArray, doneUpdate) {
		var 
			currentFeatures = this.features,
			self = this;
			
		if (!newFeaturesArray) { newFeaturesArray = [] }
		
		// transform newFeaturesArray to a array of ids, if not already
		newFeaturesArray = _.map(newFeaturesArray, function(feature){
			if (typeof(feature['_id']) === 'undefined') { 
				return feature;
			} else { 
				return feature._id.toHexString(); 
			}
		});
		
		// transform currentFeatures to a array of ids, if not already
		currentFeatures = _.map(currentFeatures, function(feature){
			if (typeof(feature['_id']) === 'undefined') { 
				return feature;
			} else { 
				return feature._id.toHexString(); 
			}
		});

		featuresToRemove = currentFeatures.filter(function(x) { 
			return newFeaturesArray.indexOf(x) < 0 
		});
		
		console.log('newFeaturesArray\n'+newFeaturesArray);
		console.log('featuresToRemove\n'+featuresToRemove);
		
		self.features = newFeaturesArray;

		self.save(doneUpdate);
		
		// async.parallel([
		// 	function(cb){ 
		// 		console.log('tarefa 1');
		// 		cb();
		// 	}, 
		// 	function(cb){ 
		// 		console.log('tarefa 2');
		// 		cb();
		// 	}
		// ], 
		// function(){
		// 		self.save(doneUpdate);
		// })
		
		

		// async.parallel([
		// 	function(callback){
		// 		if (newFeaturesArray.length == 0) { callback() };
		// 		// Features to update relation
		// 		async.each(newFeaturesArray, function(feature,cb){
		// 			mongoose.model('Feature').findById(feature, function(err, ft){
		// 				ft.addContentAndSave(self, cb);
		// 			});
		// 		}, callback); 
		// 	}, function(callback){
		// 		if (newFeaturesArray.length == 0) { callback() };
		// 		// Features do Remove
		// 		async.each(featuresToRemove, function(feature,cb){
		// 			mongoose.model('Feature').findById(feature, function(err, ft){
		// 				ft.removeContentAndSave(self, cb);
		// 			});
		// 		}, callback);
		// 	}
		// ], function(err,results) {
		// 	if (err) doneUpdate(err);
		// 	self.save(doneUpdate);
		// });
	}
}

mongoose.model('Content', ContentSchema)