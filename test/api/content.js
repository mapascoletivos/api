/*
 * Module dependencies.
 */

var 
	fs = require('fs'),
	_ = require('underscore'),
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
	uploadedImagesPath = __dirname + '/../../public/uploads/images/',	
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
	content1Id,
	image1,
	image1Id,
	image2,
	image2Id,
	image3,
	image3Id,
	imageFilenames = [],
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
		function createImages(doneCreateImages){

			async.parallel([function(done){
				image1 = new Image({
					creator: user1,
					// will store uploaded file path, which will be saved at pre-save hook
					files: {default: imageFixturePath} 
				});
				image1.save(function(err){
					should.not.exist(err);
					image1Id = image1.id;
					done();
				})
			}, function(done){
				image2 = new Image({
					creator: user1,
					files: {default: imageFixturePath} 
				});
				image2.save(function(err){
					should.not.exist(err);
					image2Id = image2.id;
					done();
				})
			}, function(done){
				image3 = new Image({
					creator: user1,
					files: {default: imageFixturePath} 
				});
				image3.save(function(err){
					should.not.exist(err);
					image3Id = image3.id;
					done();
				})
			}], doneCreateImages)

		}

		helper.whenExpressReady(function(){
			clear.all(function(err){
				should.not.exist(err);
				async.series([createUsers, createLayers, createImages], doneBefore)
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
	describe('POST /contents', function(){
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
					sections: [{
						type: 'text',
						data: {
							text: 'Some text'
						}
					},{
						type: 'yby_image',
						data: {
							id: image1._id
						}
					},{
						type: 'video',
						data: {
							source: 'youtube',
							remote_id: 'M4spK4QeUKY'
						}
					},{
						type: 'list',
						data: {
							text: 'list items'
						}
					},{
						type: 'yby_image',
						data: {
							id: image2._id
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
					body.sections.should.be.instanceof(Array).and.have.lengthOf(5);

					// first section
					section = body.sections[0];
					section.should.have.property('type', 'text');
					section.data.should.have.property('text', 'Some text');

					// second section
					section = body.sections[1];
					section.should.have.property('type', 'yby_image');
					section.data.should.have.property('id', image1.id);
					section.data.should.have.property('files');
					
					// keep image filenames to check after removal
					_.each(section.data.files, function(file){
						imageFilenames.push(file);
					});

					// third section
					section = body.sections[2];
					section.should.have.property('type', 'video');
					section.data.should.have.property('source', 'youtube');
					section.data.should.have.property('remote_id', 'M4spK4QeUKY');

					// fourth section
					section = body.sections[3];
					section.should.have.property('type', 'list');
					section.data.should.have.property('text', 'list items');

					// fifth section
					section = body.sections[4];
					section.should.have.property('type', 'yby_image');
					section.data.should.have.property('id', image2.id);
					section.data.should.have.property('files');

					// keep image filenames to check after removal
					_.each(section.data.files, function(file){
						imageFilenames.push(file);
					});					

					// save content id for later loading
					content1Id = res.body._id;

					done();

				}
			});

			it('should return error when section as invalid image data', function (done) {

				var payload = {
					layer: layer1._id,
					title: 'Content title',
					sections: [{
						type: 'text',
						data: {
							text: 'Some text'
						}
					},{
						type: 'yby_image',
						data: {
							noid: 'noid'
						}
					}]
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
					res.body.messages[0].should.have.property('text', i18n.t('mongoose.errors.content.malformed_sections'));
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

			it('should return error when user do not own layer', function (done) {

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

	describe('PUT /contents', function(){
		context('not logged in', function(){
			it('should return forbidden', function(done){
				request(app)
					.put(apiPrefix + '/contents/' + content1Id)
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

		context('logged in', function(){
			it('should change content sections accordingly', function(){

				var payload = {
					layer: 'oaiosdiasodi', // this attribute shouldn't be changed
					title: 'Content title',
					sections: [{
						type: 'text',
						data: {
							text: 'Lorem ipsum'
						}
					},{
						type: 'video',
						data: {
							source: 'youtube',
							remote_id: 'M4spK4QeUKY'
						}
					},{
						type: 'yby_image',
						data: {
							id: image1._id
						}
					},{
						type: 'yby_image',
						data: {
							id: image3._id
						}
					},{
						type: 'list',
						data: {
							text: 'list items'
						}
					}]
				}


				request(app)
					.put(apiPrefix + '/contents/' + content1Id)
					.set('Authorization', user1AccessToken)
					.send(payload)
					.expect(200)
					.end(onResponse);

				function onResponse(err, res) {
					should.not.exist(err);

					var 
						body = res.body,
						section;

					// creator should be valid
					body.should.have.property('creator');
					body.creator.should.have.property('_id', user1.id);
					body.creator.should.have.property('name', user1.name);
					body.creator.should.have.property('email', user1.email);

					// layer should be valid
					body.should.have.property('layer');
					body.layer.should.have.property('_id', layer1.id);

					// sections should be valid
					body.sections.should.be.instanceof(Array).and.have.lengthOf(5);

					// section 1
					section = body.sections[0];
					section.should.have.property('type', 'text');
					section.data.should.have.property('text', 'Lorem ipsum');

					// section 2
					section = body.sections[1];
					section.should.have.property('type', 'video');
					section.data.should.have.property('source', 'youtube');
					section.data.should.have.property('remote_id', 'M4spK4QeUKY');

					// section 3
					section = body.sections[2];
					section.should.have.property('type', 'yby_image');
					section.data.should.have.property('id', image1.id);
					section.data.should.have.property('files');
					
					// section 4
					section = body.sections[3];
					section.should.have.property('type', 'yby_image');
					section.data.should.have.property('id', image3.id);
					section.data.should.have.property('files');
					
					// keep image filenames to check after removal
					_.each(section.data.files, function(file){
						imageFilenames.push(file);
					});

					// section 5
					section = body.sections[4];
					section.should.have.property('type', 'list');
					section.data.should.have.property('text', 'list items');

					// check if image2 files where removed
					async.eachSeries(image2.files, function(filename, doneEach){
						var filepath = uploadedImagesPath + filename;
						fs.existsSync(filepath).should.be.false;
						doneEach();
					}, done);

				}				
			});
		});

	});

	describe('DEL /contents', function(){

		context('not logged in', function(){
			it('should return forbidden', function (done) {
				request(app)
					.del(apiPrefix + '/contents/' + content1Id)
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

		context('when logged in', function(){
			it('should delete content and images', function(doneIt){

				request(app)
					.del(apiPrefix + '/contents/' + content1Id)
					.set('Authorization', user1AccessToken)
					.expect(200)
					.end(onResponse);

				function onResponse(err, res) {
					should.not.exist(err);

					res.body.messages.should.have.lengthOf(1);
					messages.hasValidMessages(res.body).should.be.true;
					res.body.messages[0].should.have.property('text', i18n.t('content.destroy.success'));

					function checkImageObjectsExistence(doneCheckImageObjectsExistence){
						async.eachSeries([image1, image2], function(imgId, doneEach){
							Image.findById(imgId, function(err, img){
								should.not.exist(err);
								should.not.exist(img);
								doneEach()
							})	
						}, doneCheckImageObjectsExistence)
					}

					function checkImageFilesExistence(doneCheckImageFilesExistence) {
						async.eachSeries(imageFilenames, function(filename, doneEach){
							var filepath = uploadedImagesPath + filename;
							fs.existsSync(filepath).should.be.false;
							doneEach();
						}, doneCheckImageFilesExistence);						
					}

					function checkRemovedFromLayer(doneCheckRemovedFromLayer){
						Layer.findById(layer1.id, function(err, layer){
							should.not.exist(err);
							should.exist(layer);
							layer.contents.should.not.containEql(content1Id);
							doneCheckRemovedFromLayer();
						});
					}

					async.series([
						checkImageObjectsExistence, 
						checkImageFilesExistence, 
						checkRemovedFromLayer
					], doneIt);
				}
			});
		});
	});
});

