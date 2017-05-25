const nodecec = require('node-cec');
const NodeCec = nodecec.NodeCec;
const CEC = nodecec.CEC;

exports.create = () => {
  const devices = {};
  Object.keys(CEC.LogicalAddress).forEach(name => {
    const device = { name };
    const id = CEC.LogicalAddress[name];
    devices[id] = device;
  });

  const cec = new NodeCec('node-cec-monitor');

  cec.once( 'ready', function(client) {
    console.log( ' -- READY -- ' );
    client.sendCommand( 0xf0, CEC.Opcode.GIVE_DEVICE_POWER_STATUS );
  });

  cec.on('REPORT_POWER_STATUS', function (packet, status) {
    var keys = Object.keys( CEC.PowerStatus );

    for (var i = keys.length - 1; i >= 0; i--) {
      if (CEC.PowerStatus[keys[i]] == status) {
        console.log('POWER_STATUS:', keys[i]);
        devices[packet.target] = keys[i];
        break;
      }
    }
  });

  cec.on('REPORT_PHYSICAL_ADDRESS', (packet, source, other) => {
    console.log('REPORT_PHYSICAL_ADDRESS', packet, source, other);
  })

  cec.on('ROUTING_CHANGE', function(packet, fromSource, toSource) {
    console.log( 'Routing changed from ' + fromSource + ' to ' + toSource + '.' );
  });

  cec.on('SET_OSD_NAME', (packet, osdname) => {
    console.log('SET_OSD_NAME', packet, osdname);
  });

  cec.on('ACTIVE_SOURCE', (packet, source) => {
    console.log('ACTIVE_SOURCE', packet, source);
  });

  function getPhysicalDeviceId(deviceId) {
    return new Promise((resolve, reject) => {
      cec.sendCommand(parseInt(`0x${deviceId}f`, 16), 0x82, physicalDeviceId);
    });
  }

  return {
    cec,
    devices,
    start() {
      // -m  = start in monitor-mode
      // -d8 = set log level to 8 (=TRAFFIC) (-d 8)
      // -br = logical address set to `recording device`
      cec.start('cec-client', '-m', '-d', '8', '-b', 'r');
    },
    stop() {
      cec.stop();
    },
    turnOn(device) {
      return cec.send(`on ${getDeviceId(device)}`);
    },
    turnOff(device) {
      return cec.send(`standby ${getDeviceId(device)}`);
    },
    switchInput(device) {
      const deviceId = getDeviceId(device);
      return getPhysicalDeviceId(deviceId)
      .then(physicalDeviceId => {
        return cec.sendCommand(parseInt(`0x${deviceId}f`, 16), 0x82, physicalDeviceId);
      })
    }
  };
};


function getDeviceId(device) {
  if (typeof device === 'number') return device;
  if (typeof device === 'string') {
    return CEC.LogicalAddress[device] || -1;
  }
  return -1;
}
