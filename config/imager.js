module.exports = {
	variants: {
		items: {
			resize: {
				mini : "200x200",
				default: "800x600",
				large: "1280x1280"
			},
			thumbnail: {
				thumb: "100x100 Center"
			}
		}
  	},

	storage: {
		Local: {
			path: "public/uploads/images/"
	},
		S3: {
			key: 'API_KEY',
			secret: 'SECRET',
			bucket: 'BUCKET_NAME',
			region: 'REGION'
		}
	},
	keepName: false,
	debug: true
}