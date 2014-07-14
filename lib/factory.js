
/**
 * Module dependencies.
 **/

var 
	Factory = require('rosie').Factory,
	mongoose = require('mongoose'),
	User = require(__dirname + '/../app/models/user'),
	Feature = mongoose.model('Feature'),
	Content = mongoose.model('Content'),
	Image = mongoose.model('Image'),
	Layer = mongoose.model('Layer');

/**
 * The factories
 **/

Factory.define('User')
	.sequence('name', function(i) { return 'user' + i }) 
	.sequence('email', function(i) { return 'email' + i + '@example.com' })
	.attr('password', '123456')
	.attr('emailConfirmed', true)

Factory.define('Layer')
	.sequence('title', function(i) { return 'Title for layer' + i }) 
	.sequence('description', function(i) { return 'description for layer' + i }) 

Factory.define('Content')
	.sequence('title', function(i) { return 'Title for content' + i }) 
	.attr('sirTrevorData', function(){ 
		return [{
			type: 'text',
			data: {text: 'bbbb'}
		}, {
			type: 'type'
		}]
	})

Factory.define('Image')
	.attr('sourcefile', __dirname + '../fixtures/image-1.png');


module.exports = Factory