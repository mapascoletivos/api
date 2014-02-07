/*
 * Module dependencies.
 */

var 
	request = require('supertest'),
	should = require('should'),
	app = require('../../server'),
	mongoose = require('mongoose');
	Image = mongoose.model('Map');

var
	apiPrefix = '/api/v1';
	
