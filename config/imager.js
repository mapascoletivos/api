module.exports = {
	variants: {
		items: {
			resize: {
				mini : '300x200',
				preview: '800x600'
			},
			crop: {
				thumb: '200x200'
			},
			resizeAndCrop: {
				large: {
					resize: '1000x1000',
					crop: '900x900'
				}
			}
		},
		gallery: {
			crop: {
				thumb: '100x100'
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