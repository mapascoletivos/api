/*
 * Module dependencies.
 */

var 
	request = require('supertest'),
	should = require('should'),
	app = require('../web'),
	mongoose = require('mongoose');
	
describe('User management', function(){
	
	describe('application is not initialized', function(){
		it('should ask for a admin user');
	});
	
	describe('application is initialized', function(){
		context('admin should be able to make other user admin', function(){});
		context('admin can change other user settings', function(){});
	});
})