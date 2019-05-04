const { join } = require('path');
const config = require('config');
const sharp = require('sharp');

const imagesPath = join(global.appRoot, ...config.get('imagesPath'));

const saveImage = async function (id, sourcePath) {
  const files = {
    thumb: `thumb_${id}.png`,
    mini: `mini_${id}.png`,
    default: `default_${id}.png`,
    large: `large_${id}.png`
  };

  // Thumbnail
  await sharp(sourcePath)
    .resize(100, 100, { fit: 'inside' })
    .toFile(join(imagesPath, files.thumb));

  // Mini
  await sharp(sourcePath)
    .resize(200, 200, { fit: 'inside' })
    .toFile(join(imagesPath, files.mini));

  // Default
  await sharp(sourcePath)
    .resize(800, 600, { fit: 'inside' })
    .toFile(join(imagesPath, files.default));

  // Large
  await sharp(sourcePath)
    .resize(1280, 1280, { fit: 'inside' })
    .toFile(join(imagesPath, files.large));

  return files;
};

module.exports = {
  saveImage
};
