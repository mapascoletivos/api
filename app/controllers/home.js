
/*!
 * Module dependencies.
 */

var mongoose = require('mongoose'), 
	Feature = mongoose.model('Feature');

/**
 * Home
 */

exports.index = function (req, res) {
	if(req.isAuthenticated()) {
		res.render('layouts/default', {
			title: 'Mapas Coletivos',
			user: req.user ? JSON.stringify(req.user) : 'null'
		})	
	} else {
		res.render('home/landing', {
			selectedProjects: [
				{
					title: 'Rio dos Jogos',
					img: 'http://www.mapascoletivos.com.br/uploads/images/376_1_1371165797.jpg',
					url: 'http://www.mapascoletivos.com.br/maps/5318c652cb160eaf6d30103a/',
					description: 'Jornalismo Colaborativo: cuide do Rio!'
				},
				{
					title: 'São Paulo sem frescura',
					img: 'http://www.mapascoletivos.com.br/uploads/images/139_1_1328364227.jpg',
					url: 'http://www.mapascoletivos.com.br/maps/5318c652cb160eaf6d300f60/',
					description: 'Casas, padarias, botecos, barbearias, lojinhas, qualquer tipo de estabelecimento com um charme de antigamente, que mantiveram suas peculiaridades, sem entrar na onda da "modernização".'
				},
				{
					title: 'Trianon Acessível',
					img: 'http://www.mapascoletivos.com.br/uploads/images/396_1_1384554991.jpg',
					url: 'http://www.mapascoletivos.com.br/maps/5318c652cb160eaf6d30104e/',
					description: 'Observar a situação das calçadas e também em estabelecimentos comerciais no entorno, o excesso de postes nas esquinas, rampas de acesso e vagas para deficientes.'
				},
				{
					title: 'Cantos BA',
					img: 'http://farm3.staticflickr.com/2620/3977617811_ced60d34e9_o.jpg',
					url: 'http://www.mapascoletivos.com.br/maps/5318c652cb160eaf6d301043/',
					description: ''
				},
				{
					title: 'Vídeos Ambientais',
					img: '/img/selected-projects/53235a26cc24363c3b52cbcc.png',
					url: 'http://www.mapascoletivos.com.br/layers/53235a26cc24363c3b52cbcc/',
					description: ''
				},
				{
					title: 'Centros de adoção de animais',
					img: 'http://www.mapascoletivos.com.br/uploads/images/300_1_1350313222.jpg',
					url: 'http://www.mapascoletivos.com.br/maps/5318c652cb160eaf6d300ff4/',
					description: 'Onde adotar um bichinho de estimação (não se esqueça, não compre, adote, tem muitos cães e gatos esperando um dono que os ame)'
				}
			]
		})
	}
}

exports.about = function(req, res) {
	res.render('home/about');
}

exports.tutorial = function(req, res) {
	res.render('home/tutorial');
}

exports.terms = function(req, res) {
	res.render('home/terms');
}

exports.app = function(req, res) {
	res.render('layouts/default', {
		title: 'Mapas Coletivos'
	});
}

/**
 * Explore
 */

exports.explore = function (req, res) {
	var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
	var perPage = 30
	var options = {
		perPage: perPage,
		page: page
	}

	Feature.list(options, function(err, features) {
		if (err) return res.render('500')
		Feature.count().exec(function (err, count) {
			res.render('home/explore', {
				title: 'Features',
				features: features,
				page: page + 1,
				pages: Math.ceil(count / perPage)
			})
		})
	})
}
