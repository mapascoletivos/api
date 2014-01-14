
/*
 * Module dependencies.
 */

var request = require('supertest')
	, should = require('should')
	, app = require('../../server')
	// , http = require('http')
	// , assert = require('assert')
	, mongoose = require('mongoose')
	, User = mongoose.model('User')
	, agent = request.agent(app);


describe('API', function(){

	before(function (done) {
		// Clear DB before testing
		User.collection.remove(function(){
			// Then creates API User
			var user = new User({
				email: 'foobar@example.com',
				name: 'Foo bar',
				username: 'foobar',
				password: 'foobar'
			});
			user.save(done);
		});
	});

	describe('/api/v1/feature', function(){
		context('User IS NOT logged', function(){
			describe('When I get a existing feature', function(){
				it('should return a valid json feature');
			});

			describe('When I get a non-existing feature', function(){
				it('should return a empty json');
			});

			describe('When I post a new feature', function(){
				it('should return HTTP status code 401 (Unauthorized)');
			});
		});

		context('User IS logged', function(){
			describe('When I get a existing feature', function(){
				it('should return a valid json feature');
			});

			describe('When I get a non-existing feature', function(){
				it('should return a empty json');
			});

			describe('When I post a VALID feature', function(){
				it('should return HTTP status code 200 (OK)');
			});

			describe('When I post a NON-VALID feature', function(){
				it('should return HTTP status code 400 (Bad Request)');
			});
		});
	});

	describe('/api/v1/layer', function(){
		describe('When I get a existing layer', function(){
			it('should return a valid layer as json');
		});

		describe('When I get a non-existing feature', function(){
			it('should return a empty json');
		});
	});

	describe('/api/v1/map', function(){
		describe('When I get a existing map', function(){
			it('should return a valid map as json');
		});

		describe('When I get a non-existing feature', function(){
			it('should return a empty json');
		});
	});

	describe('/api/v1/media', function(){
		describe('When I get a existing layer', function(){
			it('should return a valid layer as json');
		});

		describe('When I get a non-existing feature', function(){
			it('should return a empty json');
		});
	});

});

