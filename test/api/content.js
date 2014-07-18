/*
 * Module dependencies.
 */

var 
	fs = require('fs'),
	async = require('async'),
	should = require('should'),
	request = require('supertest'),
	i18n = require('i18next'),
	app = require('../../web'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Content = mongoose.model('Content'),
	Image = mongoose.model('Image'),
	Layer = mongoose.model('Layer'),
	helper = require('../../lib/test-helper'),
	factory = require('../../lib/factory'),
	messages = require('../../lib/messages'),
	clear = require('../../lib/clear');

/**
 * Config
 */

var 
	apiPrefix = '/api/v1',
	imageFixturePath = __dirname + '/../../fixtures/image-1.png',
	config = require('../../config/config')['test'];

i18n.init(config.i18n);

/**
 * Local variables
 */

var	
	user1AccessToken,
	user1,
	user2,
	admin,
	content1,
	image1,
	layer1,
	layer2;


/**
 * The tests
 */

describe('Contents', function(){


	before(function (doneBefore) {

		/*
		 * Create user1, user2 and admin
		 */
		function createUsers(doneCreateUsers) {
			async.series([function(done){
					factory.createUser(function(err,usr){
						should.not.exist(err);
						user1 = usr;
						helper.login(user1.email, user1.password, function(token){
							user1AccessToken = token;						
							done();
						});
					});
				}, function(done){
					factory.createUser(function(err,usr){
						should.not.exist(err);
						user2 = usr;
						done()
					});
				}, function(done){
					factory.createUser(function(err,usr){
						should.not.exist(err);
						admin = usr;
						admin.role = 'admin';
						done()
					});
			}], doneCreateUsers);
		}		

		/*
		 * Create layer1 and layer2, associated to users
		 */
		function createLayers(doneCreateLayers){
			async.series([
				function(done){
					factory.createLayer(user1, function(err,layer){
						should.not.exist(err);
						layer1 = layer;
						done();
					});
				}, function(done){
					factory.createLayer(user2, function(err,layer){
						should.not.exist(err);
						layer2 = layer;
						done();
					});
			}], doneCreateLayers);
		}

		/*
		 * Create image
		 */
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
				async.series([createUsers, createLayers, createImage], doneBefore)
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
					.post(apiPrefix + '/contents')
					.expect(401)
					.end(function(err,res){
						should.not.exist(err);
						res.body.messages.should.have.lengthOf(1);
						messages.hasValidMessages(res.body).should.be.true;
						res.body.messages[0].should.have.property('text', i18n.t('access_token.unauthorized'));
						done();
					});
			});
		});	

		context('admin logged in', function(){
			it('can add content to any layer');
		});

		context('user1 logged in', function(){
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
					.set('Authorization', user1AccessToken)
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

					// sirTrevor string presence
					body.should.have.property('sirTrevor', JSON.stringify(payload.sirTrevorData));

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

					done();

				}
			});

			it('should return error when layer is invalid', function (done) {

				var payload = {
					layer: 'invalidid',
					title: 'Content title'
				}

				request(app)
					.post(apiPrefix + '/contents')
					.set('Authorization', user1AccessToken)
					.send(payload)
					.expect('Content-Type', /json/)
					.expect(400)
					.end(onResponse);

				function onResponse(err, res) {
					should.not.exist(err);
					res.body.messages.should.have.lengthOf(1);
					messages.hasValidMessages(res.body).should.be.true;
					res.body.messages[0].should.have.property('text', i18n.t('content.create.error.invalid_layer'));
					done();
				}
			});

			it('should return error when user not own layer', function (done) {

				var payload = {
					layer: layer2.id,
					title: 'Content title'
				}


				request(app)
					.post(apiPrefix + '/contents')
					.set('Authorization', user1AccessToken)
					.send(payload)
					.expect('Content-Type', /json/)
					.expect(403)
					.end(onResponse);

				function onResponse(err, res) {
					should.not.exist(err);
					res.body.messages.should.have.lengthOf(1);					
					messages.hasValidMessages(res.body).should.be.true;
					res.body.messages[0].should.have.property('text', i18n.t('content.create.error.layer_not_owned'));
					done();
				}
			});
		});
	});
});

