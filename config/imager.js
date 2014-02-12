module.exports = {
	variants: {
		img: {
			resizeAndCrop: {
				img: {
					resize: '1000x1000',
					crop: '900x900'
				}
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