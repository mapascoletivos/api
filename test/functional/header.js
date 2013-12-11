
/*
 * Module dependencies.
 */

var request = require('supertest')
	, should = require('should')
	, app = require('../../server')
	,	Browser = require('zombie')
	, http = require('http')
	, assert = require('assert');



describe('Application header', function () {
	before(function() {
		this.server = app
		this.browser = new Browser({ site: 'http://localhost:3000' })
	});

	describe('User not logged in ', function(){
		before(function(done) {
			this.browser.visit('/', done);
		});

	  it('should show login link', function(){
	  	assert.ok(this.browser.success);
			assert.equal(this.browser.text('a.login'), 'Entrar');
	  });

	  it('should show signup link', function(){
	  	assert.ok(this.browser.success);
			assert.equal(this.browser.text('a.signup'), 'Registrar');
		});

	  it('click login link takes to user login page');  
	  it('click login link takes to user signup page');		
	});

	describe('User is logged in', function(){
		it('should show user profile link')
		it('should show logout link')
		it('logout link click should logout')
	});

});

