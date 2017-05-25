exports.create = () => {
  const cecApi = require('./cec-api');

  return {
    cecApi,
    start() {
      cecApi.start();
    },
    stop() {
      cecApi.stop();
    }
  }
};
