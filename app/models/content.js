
/**
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
	title: { type: String, required: true },
	sections: [],
	sirTrevorData: [],
	sirTrevor: String,
	creator: {type: Schema.ObjectId, ref: 'User'},
	features: [{type: Schema.ObjectId, ref: 'Feature'}],
	layer: {type: Schema.ObjectId, ref: 'Layer', required: true},
	createdAt: {type: Date, default: Date.now},
	updatedAt: {type: Date, default: Date.now},
	tags: [String]
});

/*
 * Validator
 */

ContentSchema.path('sections').validate(function (sections) {
	console.log('validation');

	console.log(JSON.stringify(sections))

	// check if section is compatible to sirTrevor 
	if (sections.length > 0) {
		console.log('length > 0')
		_.each(sections, function(section){
			console.log('length > 0')
			console.log(section.type)
			switch (section.type) {
				case 'yby_image':
					if (!(section.data && section.data.id)) return false;
					break;
				case 'text':
					console.log('passou por aqui!!!!')
					if (!(section.data && section.data.text)) return false;
					break;
				case 'video':
					if (!(section.data && section.data.source && section.data.remove_id)) return false;
					break;
				default:
					return false;
			}
		});
	} 

	return true;
}, 'Invalid sections array');


/**
 * Methods
 */

ContentSchema.methods = {

	updateSirTrevor: function(sirTrevorData, done){
		var 
			self = this,
			imagesToRemove,
			imagesToAdd;
			
		// console.log('self\n'+self);
		console.log('sirTrevorData no updateSirTrevor\n'+sirTrevorData.length);
		console.log('self.sirTrevorData\n'+this.sirTrevorData);		
		
		function getRemovedImages(sirTrevorData){
			var removedImages = [];
			console.log('entrou no getRemovedImages');
			_.each(self.sirTrevorData, function(item){
				console.log('item dentro do getRemoveImages\n'+item.data);
				if (!item._id)
					item._id = item.data._id;
				if ((item.type == 'image') && !_.contains(sirTrevorData, item)) {
					removedImages.push(item);
				}
			})
			return removedImages;
		}

		function getAddedImages(sirTrevorData){
			var addedImages = [];
			_.each(sirTrevorData, function(item){
				console.log('item dentro do getAddedImages\n'+item.data);
				if (!item._id)
					item._id = item.data._id;
				if ((item.type == 'image') && !_.contains(self.sirTrevorData, item._id)) {
					addedImages.push(item);
				}
			})
			return addedImages;
		}
		
		imagesToRemove = getRemovedImages(sirTrevorData);
		imagesToAdd = getAddedImages(sirTrevorData);
		
		console.log('imagesToAdd\n'+imagesToAdd);
		console.log('imagesToRemove\n'+imagesToRemove);
		
		async.parallel([
			function(callback){
				if (!imagesToRemove) 
					callback();
				else
					async.each(imagesToRemove, function(item, cb){
						console.log('should remove item\n'+item);
						mongoose.model('Image').findById(item.data._id).remove(cb)
					}, callback);
			},
			function(callback){
				if (!imagesToAdd) 
					callback();
				else
					async.each(imagesToAdd, function(item, cb){
						mongoose.model('Image').findById(item.data._id, function(err, img){
							if (err) {
								cb(err);
							}
							else {
								// set reference to this content
								img.content = self;
								img.save(cb);
							}
						});
				}, callback)
			}
		], function(err){
			self.sirTrevorData = sirTrevorData;
			done(err, self);
		});
	},

	removeImageAndSave: function(imageId, done) {

		var self = this;

		async.each(self.sirTrevorData, function(item, done){
			// if image exists in sirTrevor, remove it
			if ((item.type == 'image') && (item.data._id.toHexString() == imageId.toHexString())) {
				self.sirTrevorData.pull(item);
			}
			done();			
		}, function(err){
			if (err) done(err);
			else self.save(done);
		});
	}
}

/**
 * Statics
 */

ContentSchema.statics = {

	load: function (id, cb) {
		this.findOne({ _id : id })
			.populate('creator', 'name username email')
			.populate('layer')
			.populate('features')
			.exec(cb)
	},
	
	list: function (options, cb) {
		var criteria = options.criteria || {}

		this.find(criteria)
			.populate('creator', 'name username email')
			.sort({'createdAt': -1}) // sort by date
			.limit(options.perPage)
			.skip(options.perPage * options.page)
		.exec(cb)
	}	
	
}

mongoose.model('Content', ContentSchema)