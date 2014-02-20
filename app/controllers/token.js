
/**
 * Module dependencies.
 */

var 
	_ = require('underscore'),
	mongoose = require('mongoose'), 
	Token = mongoose.model('Token');
	
/**
 * Load
 */

exports.load = function(req, res, next, id){
	Token.findById(id, function (err, token) {
		if (err) return next(err);
		if (!token) return res.json(400, new Error('not found'));
		if (token.expiresAt < Date.now()) {
			req.flash('error', 'Este token expirou');
			return res.redirect('/login');
		}
		req.token = token;
		next()
	})
}

/**
 * Activate Account Token
 */

exports.activateAccount = function(req, res){
	var
		token = req.token;
	
	// invalid route for token
	if (token.type != 'activateAccount') {
		req.flash('error', 'Token inválido.');
		return res.redirect('/login');
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				req.flash('error', 'Não foi possível ativar este usuário.')
				return res.redirect('/login');
			}
			
			user.status = 'active';

			user.save(function(err){
				// TODO render login form
				if (err)
					req.flash('error', 'Não foi possível ativar este usuário.')
				else {
					req.flash('info', 'Conta ativada com sucesso.')
				}

				return res.redirect('/login');
			});
		})
		
	}
}


/**
 * Password Reset form
 */

exports.showPasswordReset = function(req, res){
	var
		token = req.token;
	
	// invalid route for token
	if (token.type != 'passwordReset') {
		req.flash('error', 'Token inválido.');
		return res.redirect('/login');
	} else {
		res.render('users/password_reset', {user: req.user, token: token})
	}
}

/**
 * Change Password
 */

exports.changePassword = function(req, res){
	var
		token = req.token;
	
	// invalid route for token
	if (token.type != 'passwordReset') {
		req.flash('error', 'Token inválido.');
		return res.redirect('/login');
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				req.flash('error', 'Não foi possível ativar este usuário.')
				return res.redirect('/login');
			}
			
			user.password = req.body.password;

			user.save(function(err){
				// TODO render login form
				if (err)
					req.flash('error', 'Não foi possível alterar a senha deste usuário.')
				else {
					req.flash('info', 'Senha alterada com sucesso.')
				}

				return res.redirect('/login');
			});
		})
		
	}
}