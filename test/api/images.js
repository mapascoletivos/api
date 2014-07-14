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
	Image = mongoose.model('Image'),
	Content = mongoose.model('Content'),
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
	imageFixturePath = __dirname + '/../../fixtures/image-1.png',
	uploadedImagesPath = __dirname + '/../../public/uploads/images';

/**
 * Local variables
 */

var	
	userAccessToken,
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

			user1 = new User(Factory.build('User'));

			user1.save(function(err){
				should.not.exist(err);
				helper.login(user1.email, user1.password, function(token){
					userAccessToken = token;
					doneCreateUserAndLogin();
				});
			})
		}		

		// setup a layer to recieve the content and images

		function setupLayer(doneSetupLayer){

			// create layer 
			layer1 = new Layer(Factory.build('Layer', {creator: user1}));

			layer1.save(function(err){
				should.not.exist(err);
				doneSetupLayer();
			})
		}


		helper.whenExpressReady(function(){
			clear.all(function(err){
				should.not.exist(err);
				async.series([createUserAndLogin, setupLayer], doneBefore)
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
			it('should return forbidden', function (done) {
				request(app)
					.post(apiPrefix + '/images')
					.expect('Content-Type', /json/)
					.expect(403)
					.end(done)
			});
		});	

		context('logged in', function(){
			it('accepts a valid image creation request', function (done) {
				request(app)
					.post(apiPrefix + '/images')
					.set('Authorization', userAccessToken)
					.attach('attachment[file]', imageFixturePath) // attach like SirTrevor does
					.expect('Content-Type', /json/)
					.expect(200)
					.end(onResponse);

					function onResponse(err, res) {

						should.not.exist(err);
						should.exist(res.body.filename);
						user1._id.equals(res.body.creator).should.be.true;

						// thumb image file is saved properly
						var thumbFilename = uploadedImagesPath + '/thumb_' + res.body.filename;
						fs.existsSync(thumbFilename).should.be.true;
						var thumbSize = fs.statSync(thumbFilename).size; 
						thumbSize.should.be.above(0);

						// mini image file is saved properly
						var miniFilename = uploadedImagesPath + '/mini_' + res.body.filename;
						fs.existsSync(miniFilename).should.be.true;
						var miniSize = fs.statSync(miniFilename).size; 
						miniSize.should.be.above(thumbSize);

						// default image file is saved properly
						var defaultFilename = uploadedImagesPath + '/default_' + res.body.filename;
						fs.existsSync(defaultFilename).should.be.true;
						var defaultSize = fs.statSync(defaultFilename).size; 
						defaultSize.should.be.above(miniSize);

						// large image file is saved properly
						var largeFilename = uploadedImagesPath + '/large_' + res.body.filename;
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
					.post(apiPrefix + '/content')
					.expect('Content-Type', /json/)
					.expect(403)
					.end(done)
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
						type: 'image',
						data: {
							_id: image1._id
						}
					}]
				}

				// console.log(payload);

				request(app)
					.post(apiPrefix + '/contents')
					.set('Authorization', userAccessToken)
					.send(payload)
					.expect('Content-Type', /json/)
					.expect(200)
					.end(onResponse)



				function onResponse(err, res) {
					console.log(err);
					console.log(res.body);
					should.not.exist(err);
					done();

					// content should exist


				}
			});
		});	


	})

	/**
	 * Delete images when content is removed
	 */
	describe('DEL /content', function(){


		context('logged in', function(){
			it('should delete images when content is deleted', function(done){


				// post content with image


				done();
				// setupContent(done);
								

			});
		})
	});
});