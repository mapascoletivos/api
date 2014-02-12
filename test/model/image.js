/*
 * Module dependencies.
 */

var 
	request = require('supertest'),
	should = require('should'),
	app = require('../../web'),
	mongoose = require('mongoose');
	Image = mongoose.model('Image'),
	Content = mongoose.model('Content'),
	Factory = require('../../lib/factory');

var
	apiPrefix = '/api/v1',
	imageFile = 'fixtures/ecolab.png';

describe('Image model', function(){
	var
		user,
		layer,
		content,
		image1,
		image2;

	before(function(doneBefore){
		
		async.parallel([
			function(callback){
				Factory.create('User', function(usr){
					user = usr;
					callback();
				});
			},
			function(callback){
				Factory.create('Layer', function(lyr){
					layer = lyr;
					callback();
				});
			},
			function(callback){
				Factory.create('Image', {sourcefile: imageFile}, function(img1){
					image1 = img1;
					img1.uploadImageAndSave(imageFile, 'url', callback);
				})
			},
			function(callback){
				Factory.create('Image', {sourcefile: imageFile}, function(img2){
					image2 = img2;
					img2.uploadImageAndSave(imageFile, 'url', callback);
				})
			}
		], function(err,results){
			Factory.build('Content', {creator: user, layer: layer}, function(cnt){
				cnt.updateSirTrevor([{
					data: image1,
					type: "image"
				},{
					data: image2,
					type: "image"
				}], function(ct){
					ct.save(function(err){
						should.not.exist(err);
						content = ct;
						doneBefore();
					});
				})
			});
		});
	});

	describe('DEL /images', function(){
		it('should remove from associated content', function(){
			content.sirTrevorData[0].data._id.should.eql(image1._id);
			content.sirTrevorData[1].data._id.should.eql(image2._id);
			
			Image.findById(image1._id ,function(err, img){
				should.not.exist(err);
				should.exist(img);
			// Image.findById(image1._id, function(err,img){//.remove(function(err){
				img.remove(function(err){
					should.not.exist(err);
					Content.findById(content._id, function(err, ct){
						ct.sirTrevorData[0].data._id.should.not.eql(image1._id);
						ct.sirTrevorData[0].data._id.should.eql(image2._id);
					});
				});
			});
		});
	});
})
