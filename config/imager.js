const path = require('path');

const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

module.exports = {
  variants: {
    items: {
      resize: {
        mini: '200x200',
        default: '800x600',
        large: '1280x1280'
      },
      thumbnail: {
        thumb: '100x100 Center'
      }
    }
  },

  storage: {
    Local: {
      path: uploadsDir
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
};
