/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Notifier = require('notifier')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]

/**
 * Notification methods
 */

var Notify = {

	token: function (options, cb) {

		var user = options.user;
		var notifier = new Notifier(config.notifier)

		var obj = {
			name: user.name,
			to: user.email,
			from: 'ajuda@mapascoletivos.com.br',
			subject: 'Recuperação de senha',
			token: '111111111'
		}
		
		notifier.send('token', obj, function (err) {
		  if (err) return console.log(err);
		  console.log('Successfully sent Notifiaction!');
		});
	}
}

/**
 * Expose
 */

module.exports = Notify