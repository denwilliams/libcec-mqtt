const { join } = require('path');
module.exports = require('loke-config').create('cecmqtt', { appPath: join(__dirname, '/../') });
