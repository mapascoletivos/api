
/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function (req, res, next) {
	if (req.isAuthenticated()) return next()
	if (req.method == 'GET') req.session.returnTo = req.originalUrl
	res.redirect('/login')
}

/*
 *  Feature authorization 
 */

exports.feature = {
	hasAuthorization: function (req, res, next) {
		if (req.feature.creator.id != req.user.id) {
			req.flash('info', 'You are not authorized')
			return res.redirect('/features/' + req.feature.id)
		}
		next()
	}
}