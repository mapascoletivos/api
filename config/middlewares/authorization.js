
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
	requireOwnership: function (req, res, next) {
		if (req.method == 'POST') {
			// POST: new feature require layer ownership
			if (req.layer.creator.id != req.user.id) {
				return res.json(403, {message: 'Unauthorized'});
			}
		} else {
			// PUT: existing feature require feature ownership
			if (req.feature.creator.id != req.user.id) {
				return res.json(403, {message: 'Unauthorized'});
			}
		}
		next();
	}
}
