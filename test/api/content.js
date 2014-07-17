/*
 * Module dependencies.
 */

var 
	fs = require('fs'),
	async = require('async'),
	should = require('should'),
	request = require('supertest'),
	app = require('../../web'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Content = mongoose.model('Content'),
	Image = mongoose.model('Image'),
	Layer = mongoose.model('Layer'),
	helper = require('../../lib/test-helper'),
	Factory = require('../../lib/factory'),
	messages = require('../../lib/messages'),
	clear = require('../../lib/clear');

/**
 * Config
 */

var 
	apiPrefix = '/api/v1',
	imageFixturePath = __dirname + '/../../fixtures/image-1.png';

/**
 * Local variables
 */

var	
	userAccessToken,
	user1,
	content1,
	image1,
	layer1;


/**
 * The tests
 */

describe('Contents', function(){


	before(function (doneBefore) {
		function createUserAndLogin(doneCreateUserAndLogin) {
			user1 = new User(Factory.build('User'));
			user1.save(function(err){
				should.not.exist(err);
				helper.login(user1.email, user1.password, function(token){
					userAccessToken = token;
					doneCreateUserAndLogin();
				});
			})
		}		

		// create a layer to recieve the content
		function createLayer(doneCreateLayer){
			layer1 = new Layer(Factory.build('Layer', {creator: user1}));
			layer1.save(function(err){
				should.not.exist(err);
				doneCreateLayer();
			})
		}

		// create an image
		function createImage(doneCreateImage){
			image1 = new Image({
				creator: user1,
				// will store uploaded file path, which will be saved at pre-save hook
				files: {default: imageFixturePath} 
			});
			image1.save(function(err){
				should.not.exist(err);
				doneCreateImage();
			})
		}


		helper.whenExpressReady(function(){
			clear.all(function(err){
				should.not.exist(err);
				async.series([createUserAndLogin, createLayer, createImage], doneBefore)
			});
		});
	});

	after(function (done) {
		clear.all(function(err){
			should.not.exist(err);
			done(err);
		});
	});

	/**
	 * Create content
	 */
	describe('POST /content', function(){
		context('not logged in', function(){
			it('should return forbidden', function (done) {
				request(app)
					.post(apiPrefix + '/content')
					.expect('Content-Type', /json/)
					.expect(403)
					.end(done)
			});
		});	

		context('logged in', function(){
			it('accepts a valid content creation request', function (done) {

				var payload = {
					layer: layer1._id,
					title: 'Content title',
					sirTrevorData: [{
						type: 'text',
						data: {
							text: 'Some text'
						}
					},{
						type: 'yby_image',
						data: {
							id: image1._id
						}
					}, {
						type: 'video',
						data: {
							source: 'youtube',
							remote_id: 'M4spK4QeUKY'
						}
					}, {
						type: 'list',
						data: {
							text: 'list items'
						}
					}]
				}


				request(app)
					.post(apiPrefix + '/contents')
					.set('Authorization', userAccessToken)
					.send(payload)
					.expect('Content-Type', /json/)
					.expect(200)
					.end(onResponse);

				function onResponse(err, res) {
					should.not.exist(err);

					var 
						body = res.body,
						section;

					// creator should be valid
					body.should.have.property('creator', user1.id);

					// layer should be valid

					body.should.have.property('layer', layer1.id);

					// sections should be valid
					body.sections.should.be.instanceof(Array).and.have.lengthOf(4);

					// first section
					section = body.sections[0];
					section.should.have.property('type', 'text');
					section.data.should.have.property('text', 'Some text');

					// second section
					section = body.sections[1];
					section.should.have.property('type', 'yby_image');
					section.data.should.have.property('id', image1.id);

					// third section
					section = body.sections[2];
					section.should.have.property('type', 'video');
					section.data.should.have.property('source', 'youtube');
					section.data.should.have.property('remote_id', 'M4spK4QeUKY');

					// fourth section
					section = body.sections[3];
					section.should.have.property('type', 'list');
					section.data.should.have.property('text', 'list items');

					// sirTrevor string


				}
			});

			it('should return error when user does not own layer', function (done) {

				var payload = {
					layer: 'invalidid',
					title: 'Content title'
				}


				request(app)
					.post(apiPrefix + '/contents')
					.set('Authorization', userAccessToken)
					.send(payload)
					.expect('Content-Type', /json/)
					.expect(200)
					.end(onResponse);

				function onResponse(err, res) {
					should.not.exist(err);

					var 
						body = res.body,
						section;

					// creator should be valid
					user1._id.should.be.equals(body.creator);

					// layer should be valid
					layer1._id.should.be.equals(body.creator);

					// sections should be valid
					body.sections.should.be.instanceof(Array).and.have.lengthOf(4);

					// first section
					section = body.section[0];
					section.type.should.equals('text');
					section.data.text.should.equals('Some text');

				}
			});

						it('should return error when layer is invalid', function (done) {

				var payload = {
					layer: 'invalidid',
					title: 'Content title'
				}


				request(app)
					.post(apiPrefix + '/contents')
					.set('Authorization', userAccessToken)
					.send(payload)
					.expect('Content-Type', /json/)
					.expect(200)
					.end(onResponse);

				function onResponse(err, res) {
					should.not.exist(err);

					var 
						body = res.body,
						section;

					// creator should be valid
					user1._id.should.be.equals(body.creator);

					// layer should be valid
					layer1._id.should.be.equals(body.creator);

					// sections should be valid
					body.sections.should.be.instanceof(Array).and.have.lengthOf(4);

					// first section
					section = body.section[0];
					section.type.should.equals('text');
					section.data.text.should.equals('Some text');

				}
			});
		});
	});
});

