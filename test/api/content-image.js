/*
 * Module dependencies.
 */

var 
	async = require('async'),
	should = require('should'),
	request = require('supertest'),
	app = require('../../web'),
	mongoose = require('mongoose'),
	Content = mongoose.model('Content'),
	Factory = require('../../lib/factory'),
	messages = require('../../lib/messages'),
	helper = require('../../lib/test-helper'),
	clear = require('../../lib/clear');

var
	apiPrefix = '/api/v1',
	imageFixturePath = __dirname + '/../../fixtures/ecolab.png',
	uploadedImagesPath = __dirname + '/../../public/uploads/images',
	userAccessToken,
	userModel,
	layerModel,
	imageModel;


describe('Content x Image', function(){



	before(function (doneBefore) {
		function createUser(callback) {
			Factory.create('User', function(user){
				userModel = user;
				helper.login(user.email, user.password, function(token){
					userAccessToken = token;
					callback();
				});
			});			
		}

		function createLayer(callback) {
			Factory.build('Layer', function(layer){
				layer.creator = userModel;
				layer.save(function(err){
					should.not.exist(err);
					layerModel = layer;
					callback()	
				})
			});			
		}

		function createImage(callback) {
			Factory.create('Image', function(img){
				imageModel = img;
				callback();
			});
		}


		helper.whenExpressReady(function(){
			clear.all(function(err){
				should.not.exist(err);
				createUser(function(){
					async.parallel([createLayer, createImage], doneBefore)
				})
			});
		});
	});

	after(function (done) {
		clear.all(function(err){
			should.not.exist(err);
			done(err);
		});
	});

});