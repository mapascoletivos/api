/*
 * Module dependencies.
 */

var 
	request = require('supertest'),
	should = require('should'),
	app = require('../../web'),
	mongoose = require('mongoose');

var
	apiPrefix = '/api/v1';

describe('Map controller ', function(){

	/**
	 * Create map
	 */
	// describe('POST /maps', function(){
	// 	context('When not logged in', function(){
	// 		it('should redirect to /login', function (done) {
	// 			request(app)
	// 				.post(apiPrefix + '/maps')
	// 				.expect('Content-Type', /plain/)
	// 				.expect(302)
	// 				.expect('Location', '/login')
	// 				.expect(/Moved Temporarily/)
	// 				.end(done)
	// 		});
	// 	});
	// });
});