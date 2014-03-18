
/**
 * Module dependencies
 */

var 
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	util = require("util"),
	async = require('async');

/**
 * Layer schema
 */

var LayerSchema = new Schema({
	title: { type: String, required: true },
	description: String,
	creator: {type: Schema.ObjectId, ref: 'User'},
	maps: [{type: Schema.ObjectId, ref: 'Map'}],
	createdAt: {type: Date, default: Date.now},
	updateAt: {type: Date, default: Date.now},
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	type: { type: String, enum: ['FeatureLayer', 'TileLayer'], default: 'FeatureLayer'},

	// Content Layer Attributes
	contributors: [{type: Schema.ObjectId, ref: 'User'}],
	features: [{type: Schema.ObjectId, ref: 'Feature'}],
	contents: [{type: Schema.ObjectId, ref: 'Content'}],
	isDraft: {type: Boolean, default: true},
	oldId: Number,

	// Tile Layer Attributes 
	url: String,
	properties: {}

});

/**
 * Hooks
 */

LayerSchema.pre('remove', function(next) {
	var self = this;

	async.parallel([ 
		// remove features
		function(callback){
			async.each(self.features, function(feature, doneRemoveFeature){
				feature.remove(function(err){
					doneRemoveFeature(err);
				})
			}, callback);
		},
		// remove contents
		function(callback){
			async.each(self.contents, function(content, doneRemoveContent){
				content.remove(function(err){
					doneRemoveContent(err);
				})
			}, callback);
		},
		// dessoaciate from maps
		function(callback){
			async.each( self.maps, 
				function(mapId, doneDessociateFromMap){
					console.log(mapId);
					mongoose.model('Map').findById(mapId, function(err, map){
						map.removeLayerAndSave(self, doneDessociateFromMap);
					})
			}, callback);
		}
	], next)

});

/**
 * Methods
 */

LayerSchema.methods = {
	removeMapAndSave: function(map, done){
		var self = this;
		
		self.maps.pull({ _id: map._id });
		
		self.save(done);
	}
}

/**
 * Statics
 */

LayerSchema.statics = {

	load: function (id, doneLoading) {
		this.findOne({ _id : id })
			.populate('creator', 'name username email')
			.populate('contributors', 'name username email')
			.populate('features')
			.populate('features.creator')
			.populate('contents')
			.exec(function(err, layer){
				
				if (err || !layer) {

					doneLoading(err, null);

				} else {

					var populateFeaturesCreator = function(features, donePopulateFeatures) {
						var populatedFeatures = [];
						async.each(features, function(feature, cb){
							feature.populate('creator', 'name username email', function(err, feature){
								populatedFeatures.push(feature);
								cb();
							})
						}, function(err){
							donePopulateFeatures(err, populatedFeatures);
						});
					}
					
					var populateContentsCreator = function(contents, donePopulateContents) {
						var populatedContents = [];
						async.each(contents, function(content, cb){
							content.populate('creator', 'name username email', function(err, content){
								populatedContents.push(content);
								cb();
							})
						}, function(err){
							donePopulateContents(err, populatedContents);
						});					
					}
					
					async.parallel([
							function(cb){
								populateFeaturesCreator(layer.features, function(err, features){
									layer.features = features;
									cb(err)
								})
							},
							function(cb){
								populateContentsCreator(layer.contents, function(err, contents){
									layer.contents = contents;
									cb(err)
								})
							}
					], function(err){
						doneLoading(err, layer);
					});
				}
			});
	},

	list: function (options, cb) {
		var criteria = options.criteria || {}

		this
			.find(criteria)
			.populate('creator', 'name username email')
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(cb)
	}
	
}


mongoose.model('Layer', LayerSchema)
