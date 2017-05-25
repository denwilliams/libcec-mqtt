const lib = require('./lib');

lib.start();

process.on( 'SIGINT', function() {
  lib.stop();
  process.exit();
});
