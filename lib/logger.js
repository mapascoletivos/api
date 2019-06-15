const winston = require('winston');

module.exports = winston.createLogger({
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});
