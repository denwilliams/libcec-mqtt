const lib = require('./lib').create();

lib.start();

process.on( 'SIGINT', function() {
  lib.stop();
  process.exit();
});
