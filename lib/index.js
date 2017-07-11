const config = require('./config');
const logger = require('./logger');

exports.create = () => {
  const cecApi = require('./cec-api').create({ config });
  const mqtt = require('./mqtt').create({ config, cecApi });

  return {
    cecApi,
    start() {
      cecApi.start();
      mqtt.start();
    },
    stop() {
      cecApi.stop();
      mqtt.stop();
    }
  }
};
