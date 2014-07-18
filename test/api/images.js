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
	Image = mongoose.model('Image'),
	Content = mongoose.model('Content'),
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
	image1,
	content1,
	layer1;

/**
 * The tests
 */

describe('Images API', function(){


	before(function (doneBefore) {

		function createUserAndLogin(doneCreateUserAndLogin) {
			factory.createUser(function(err,usr){
				should.not.exist(err);
				user1 = usr;
				helper.login(user1.email, user1.password, function(token){
					user1AccessToken = token;						
					doneCreateUserAndLogin();
				});
			});
		}		

		function createLayer(doneCreateLayer){
			factory.createLayer(user1, function(err,layer){
				should.not.exist(err);
				layer1 = layer;
				doneCreateLayer();
			});
		}


		helper.whenExpressReady(function(){
			clear.all(function(err){
				should.not.exist(err);
				async.series([createUserAndLogin, createLayer], doneBefore)
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
	 * Create Image
	 */
	describe('POST /images', function(){
		context('not logged in', function(){
			it('should return unauthorized', function (done) {
				request(app)
					.post(apiPrefix + '/images')
					.expect(401)
					.end(function(err,res){
						should.not.exist(err);
						res.body.messages.should.have.lengthOf(1);
						messages.hasValidMessages(res.body).should.be.true;
						res.body.messages[0].should.have.property('text', i18n.t('access_token.unauthorized'));
						done();
					})
			});
		});	

		context('logged in', function(){
			it('accepts a valid image creation request', function (done) {
				request(app)
					.post(apiPrefix + '/images')
					.set('Authorization', user1AccessToken)
					.attach('attachment[file]', imageFixturePath) // attach like SirTrevor does
					.expect('Content-Type', /json/)
					.expect(200)
					.end(onResponse);

					function onResponse(err, res) {

						should.not.exist(err);
						should.exist(res.body.files.mini);
						should.exist(res.body.files.thumb);
						should.exist(res.body.files.default);
						should.exist(res.body.files.large);
						user1._id.equals(res.body.creator).should.be.true;

						// thumb image file is saved properly
						var thumbFilename = uploadedImagesPath + res.body.files.thumb;
						fs.existsSync(thumbFilename).should.be.true;
						var thumbSize = fs.statSync(thumbFilename).size; 
						thumbSize.should.be.above(0);

						// mini image file is saved properly
						var miniFilename = uploadedImagesPath + res.body.files.mini;
						fs.existsSync(miniFilename).should.be.true;
						var miniSize = fs.statSync(miniFilename).size; 
						miniSize.should.be.above(thumbSize);

						// default image file is saved properly
						var defaultFilename = uploadedImagesPath + res.body.files.default;
						fs.existsSync(defaultFilename).should.be.true;
						var defaultSize = fs.statSync(defaultFilename).size; 
						defaultSize.should.be.above(miniSize);

						// large image file is saved properly
						var largeFilename = uploadedImagesPath + res.body.files.large;
						fs.existsSync(largeFilename).should.be.true;
						var largeSize = fs.statSync(largeFilename).size; 
						largeSize.should.be.above(defaultSize);

						Image.findOne({}, function(err, img){
							should.not.exist(err);

							user1._id.equals(img.creator).should.be.true;
							
							user1._id.equals(img.creator).should.be.true;
							should(img.filename).equal(res.body.filename);

							// old properties that should be gone
							should.not.exist(img.file);
							should.not.exist(img.content);

							// keep image object to test file removal
							image1 = img;

							done();
						});
					}
			});

			it('missing attachment');
			it('invalid image');
		});	
	});	

	describe('POST /content with image', function(){
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
					})

			});
		});	

		context('logged in', function(){
			it('should hage image item properly', function (done) {

				var payload = {
					layer: layer1._id,
					type: 'Post',
					title: 'A content',
					sirTrevorData: [{
						type: 'text',
						data: {
							text: 'Some text'
						}
					},
					{
						type: 'yby_image',
						data: {
							_id: image1._id
						}
					}]
				}

				request(app)
					.post(apiPrefix + '/contents')
					.set('Authorization', user1AccessToken)
					.send(payload)
					.expect('Content-Type', /json/)
					.expect(200)
					.end(onResponse)

				function onResponse(err, res) {
					should.not.exist(err);
					done();


				}
			});
		});	


	})

	/**
	 * Delete images when content is removed
	 */
	describe('DEL /content', function(){


		context('logged in', function(){
			it('should delete images when content is deleted');
		})
	});
});