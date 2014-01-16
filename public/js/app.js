(function($) {

	var map;

	$(document).ready(function() {

		if($('#map').length) {

			map = L.map('map', {
				center: [0, 0],
				zoom: 2
			});

			map.addLayer(L.tileLayer('http://tile.stamen.com/toner/{z}/{x}/{y}.png'));

		}

	});

})(jQuery);