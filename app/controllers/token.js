
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
		if (!token){
			return res.render('tokens/index', {errors: ['Token não encontrado.']});	
		} 
		if (token.expiresAt < Date.now()) {
			return res.render('tokens/index', {errors: ['Este token expirou.']});	
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
		return res.render('tokens/index', {errors: ['Token inválido.']});	
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				return res.render('tokens/index', {errors: ['Não foi possível ativar este usuário.']});
			}
			
			user.status = 'active';

			user.save(function(err){
				if (err)
					return res.render('tokens/index', {errors: ['Não foi possível ativar este usuário.']});
				else {
					req.flash('info', 'Conta ativada com sucesso, faça o login agora.')
					return res.redirect('/login');
				}
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

	console.log(token);
	
	// invalid route for token
	if (token.type != 'password_reset') {
		return res.render('tokens/index', {errors: ['Token inválido.']});
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
		return res.render('tokens/index', {errors: ['Token inválido.']});
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				return res.render('tokens/index', {errors: ['Houve um erro no pedido de alteração de senha.']});
			}
			
			user.password = req.body.password;

			user.save(function(err){
				if (err)
					return res.render('tokens/index', {errors: ['Não foi possível alterar a senha deste usuário.']});
				else {
					return res.render('tokens/index', {info: ['Senha alterada com sucesso.']});
				}
			});
		})
		
	}
}

/**
 * Migrate account
 */

exports.migrateAccount = function(req, res){
	var
		token = req.token;
	
	// invalid route for token
	if (token.type != 'migrate_account') {
		return res.render('tokens/index', {errors: ['Token inválido.']});
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				return res.render('tokens/index', {errors: ['Houve um erro na migração da conta.']});
			}
			
			user.password = token.data.password;
			user.status = 'active';

			user.save(function(err){
				if (err)
				return res.render('tokens/index', {errors: ['Não foi possível migrar a conta deste usuário']});
				else {
					req.flash('info', 'Usuário migrado com sucesso.')
				}

				return res.redirect('/login');
			});
		})
		
	}
}

/**
 * Change e-mail
 */

exports.emailChange = function(req, res){
	var
		token = req.token,
		error = [],
		info = [];
	

	console.log('tá chegando');
	// invalid route for token
	if (token.type != 'email_change') {
		return res.render('tokens/index', {errors: ['Token inválido.']});
	} else {
		mongoose.model('User').findById(token.user, function(err, user){
			if (err) {
				return res.render('tokens/index', {
					errors: ['Houve um erro na solicitação de alteração de e-mail.']
				});
			}
			
			user.email = token.data.email;

			user.save(function(err){
				// TODO render login form
				if (err)
					return res.render('tokens/index', {
						errors: ['Não foi possível alterar o e-mail deste usuário.']
					});
				else {
					return res.render('tokens/index', {
						info: ['E-mail alterado com sucesso.']
					});
				}
			});
		})
	}
}