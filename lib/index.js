exports.create = () => {
  const cecApi = require('./cec-api').create();

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
