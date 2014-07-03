/*
 * Module dependencies.
 */

var 
	async = require('async'),
	should = require('should'),
	request = require('supertest'),
	app = require('../../web'),
	mongoose = require('mongoose'),
	Factory = require('../../lib/factory'),
	messages = require('../../lib/messages'),
	clear = require('../../lib/clear');

var
	apiPrefix = '/api/v1',
	imageFixturePath = __dirname + '/../../fixtures/ecolab.png',
	uploadedImagesPath = __dirname + '/../../public/uploads/images',
	userAccessToken,
	userModel,
	layerModel;


describe('Content x Image', function(){


	// before(function(doneBefore) {

	// 	function createUser(callback) {
	// 		Factory.create('User', function(user){
	// 			console.log('criou usuário')
	// 			userModel = user;
	// 			login(userModel, callback);
	// 		});			
	// 	}		

	// 	function createLayer(callback) {
	// 		Factory.build('Layer', function(l){
	// 			console.log('layer')
	// 			l.creator = userModel;
	// 			l.save(callback);
	// 		});			
	// 	}

	// 	function createImage(callback) {
	// 		Factory.build('Image', function(l){
	// 			console.log('image')
	// 			l.creator = userModel;
	// 			l.save(callback);
	// 		});			
	// 	}

	// 	mongoose.connection.on('open', function(){
	// 		clear.all(function(err){
	// 			should.not.exist(err);
	// 			async.series([createUser, createLayer, createImage], doneBefore);
	// 		});
	// 	});
	// })

	// after(function (done) {
	// 	clear.all(function(err){
	// 		should.not.exist(err);
	// 		done(err);
	// 	});
	// })

	describe('POST /Content', function(){
		it('should append image properly');
	});
});