
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
	if ((token.type != 'password_reset') || (token.type != 'password_update')) {
		req.flash('error', 'Token inválido.');
		return res.redirect('/login');
	} else {
		res.render('users/password_change', {user: req.user, token: token})
	}
}

/**
 * Change Password
 */

exports.passwordReset = function(req, res){
	var
		token = req.token;
	
	// invalid route for token
	if (token.type != 'password_reset') {
		req.flash('error', 'Token inválido.');
		return res.redirect('/login');
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				req.flash('error', 'Houve um erro no pedido de alteração de senha.')
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

/**
 * Update Password
 */

exports.passwordUpdate = function(req, res){
	var
		token = req.token;
	
	// invalid route for token
	if (token.type != 'password_update') {
		req.flash('error', 'Token inválido.');
		return res.redirect('/login');
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				req.flash('error', 'Houve um erro no pedido de alteração de senha.')
				return res.redirect('/login');
			}
			
			user.password = req.body.password;
			user.status = 'active';

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

/**
 * Update Password
 */

exports.emailChange = function(req, res){
	var
		token = req.token;
	

	console.log('tá chegando');
	// invalid route for token
	if (token.type != 'email_change') {
		req.flash('error', 'Token inválido.');
		return res.redirect('/login');
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				req.flash('error', 'Houve um erro no pedido de alteração de e-mail.')
				return res.redirect('/login');
			}
			
			user.email = token.data.email;

			user.save(function(err){
				// TODO render login form
				if (err)
					req.flash('error', 'Não foi possível alterar o seu e-mail, contate o suporte.')
				else {
					req.flash('info', 'E-mail alterado com sucesso.')
				}

				return res.redirect('/login');
			});
		})
		
	}
}