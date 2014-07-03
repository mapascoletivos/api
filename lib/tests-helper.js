

var 
	request = require('supertest'),
	should = require('should'),
	mongoose = require('mongoose'),
	app = require('../web');


/**
 * Wait mongoose to be ready to start calling the API
 **/
exports.whenExpressReady = function(done){

	// not ready yet
	if (mongoose.connection.readyState != 1) 
		// wait
		mongoose.connection.on('open', done)

	// is ready, proceed
	else done();
}

/**
 * Helper function to log in a user
 **/
exports.login = function(email, password, callback){
	request(app)
		.post('/api/v1/access_token/local')
		.send({ email: email, password: password })
		.end(function(err, res){
			should.not.exist(err);
			should(res).have.property('status', 200);
			should.exist(res.body.accessToken);
			callback('Bearer '+ res.body.accessToken);
		});

}