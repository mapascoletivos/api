
/*!
 * Module dependencies
 */

var 
	async = require('async'),
	mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	_ = require('underscore');

/**
 * Map schema
 */

var MapSchema = new Schema({
	title: { type: String, required: true },
	description: String,
	creator: {type: Schema.ObjectId, ref: 'User'},
	layers: [{type: Schema.ObjectId, ref: 'Layer'}],
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now},
	maxZoom: Number,
	minZoom: Number,
	zoom: Number,
	center: [Number,Number], // [ lat , lon ]
	southWest: [Number,Number],
	northEast: [Number,Number],
	visibility: { type: String, enum: ['Public', 'Visible', 'Private'], default: 'Private'},
	layout:{ type: String, enum: ['Scroll', 'Timeline'], default: 'Scroll'},
	tags: [String],
	isDraft: {type: Boolean, default: true}
});


/**
 * Pre-save hooks
 */

MapSchema.pre('remove', function(next){
	var self = this;
	// remove references from layers
	async.each( self.layers, 
		function(layerId, done){
			mongoose.model('Layer').findById(layerId, function(err, layer){
				if(layer)
					layer.removeMapAndSave(self, done);
				else
					done();
			})
		}, next);
});

/**
 * Methods
 */

MapSchema.methods = {

	removeLayerAndSave: function(layer, done){
		var 
			self = this;

		if (typeof(layer['_id']) != 'undefined') { layer = layer._id; }

		self.layers = _.without(self.layers, _.findWhere(self.layers, layer));

		self.save(done);
	},
	
	setLayersAndSave: function(layersSet, done) {
		var 
			self = this;

		async.each(this.layers, function(layerId, cb){
			mongoose.model('Layer').findById(layerId, function(err,layer){
				layer.maps.pull(self._id.toHexString());
				layer.save(cb);
			})
		}, 
		function(err){
			if (err) done(err);

			if(!layersSet)
				layersSet = [];

			async.each(layersSet, function(layerId, cb){
				mongoose.model('Layer').findById(layerId, function(err, layer){
					layer.maps.addToSet(self._id);
					layer.save(cb);
				})
			}, function(err){
				if (err) done(err);
				self.layers = layersSet;
				self.save(done);
			});
			
		});
		

	}
}

/**
 * Statics
 */

MapSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('creator', 'name username email')
			.exec(cb)
	},
	
	list: function (options, cb) {
		var criteria = options.criteria || {}

		this.find(criteria)
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(cb)
	}	
	
}

mongoose.model('Map', MapSchema);