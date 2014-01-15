
/*!
 * Module dependencies.
 */

exports.index = function (req, res) {
	if(req.isAuthenticated()) {
	  res.render('home', {
	    title: 'Mapas Coletivos'
	  })	
	} else {
		res.render('home/landing', {
			title: 'Mapas Coletivos'
		})
	}
}
