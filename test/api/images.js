/*
 * Module dependencies.
 */

var 
	request = require('supertest'),
	app = require('../../web'),
	mongoose = require('mongoose'),
	Image = mongoose.model('Image'),
	Factory = require('../../lib/factory'),
	clearDb = require('../../lib/clearDb');

var
	apiPrefix = '/api/v1',
	imageFile = 'fixtures/ecolab.png';

/*
 * Helper function to log a user
 */

function loginUser(agent, user){
	return function(done) {
		agent
		.post('/users/session')
		.send({ email: user.email, password: user.password })
		.end(onResponse);

		function onResponse(err, res) {
			// test redirect to dashboard
			res.should.have.status(302); 
			res.header['location'].should.not.include('/login');
			return done();
		}
	}
}



describe('Images API', function(){

	var 
		loggedAgent = request.agent(app),
		user1;

	before(function (done) {
		mongoose.connection.on('open', function(){
			Factory.create('User', function(user){
				user1 = user;
				return loginUser(loggedAgent,user1)(done);
			});			
	  	})
	})

	after(function(){
		console.log('ENTROU')
		clearDb.run();
	})

	/**
	 * Create Image
	 */
	describe('POST /images', function(){
		context('not logged in', function(){
			it('should redirect to /login', function (done) {
				request(app)
					.post(apiPrefix + '/images')
					.expect('Content-Type', /plain/)
					.expect(302)
					.expect('Location', '/login')
					.expect(/Moved Temporarily/)
					.end(done)
			});
		});
	
		// context('logged in', function(){
			
		// 	describe('without features or images');

		// });
	});

	
	
});