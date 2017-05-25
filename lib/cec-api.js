const nodecec = require('node-cec');
const NodeCec = nodecec.NodeCec;
const CEC = nodecec.CEC;
const DEVICE_TYPES = {
  '0': 'TV',
  '1': 'Recording Device',
  '2': 'Reserved',
  '3': 'Tuner',
  '4': 'Playback Device',
  '5': 'Audio System'
};

exports.create = () => {
  const devices = {};
  let interval;

  Object.keys(CEC.LogicalAddress).forEach(name => {
    const device = { name };
    const id = CEC.LogicalAddress[name];
    devices[id] = device;
  });

  const cec = new NodeCec('node-cec-monitor');

  cec.once( 'ready', function(client) {
    console.log( ' -- READY -- ' );

    interval = setInterval(scan, 600000);
    setTimeout(scan, 5000);
  });

  function scan() {
    let id = 0;
    let interval = setInterval(() => {
      cec.sendCommand(0xf0 + id, CEC.Opcode.GIVE_DEVICE_POWER_STATUS);
      id++;
      if (id >= 15) clearInterval(interval);
    }, 1000);

    setTimeout(() => {
      let id = 0;

      let interval = setInterval(() => {
        cec.sendCommand(0xf0 + id, CEC.Opcode.GIVE_OSD_NAME);
        id++;
        if (id >= 15) clearInterval(interval);
      }, 1000);
    }, 30000);

    setTimeout(() => {
      let id = 0;

      let interval = setInterval(() => {
        cec.sendCommand(0xf0 + id, CEC.Opcode.GIVE_PHYSICAL_ADDRESS);
        id++;
        if (id >= 15) clearInterval(interval);
      }, 1000);
    }, 60000);
  }

  cec.on('REPORT_POWER_STATUS', function (packet, status) {
    var keys = Object.keys( CEC.PowerStatus );
    const deviceId = parseInt(packet.source, 16);

    for (var i = keys.length - 1; i >= 0; i--) {
      if (CEC.PowerStatus[keys[i]] == status) {
        console.log('POWER_STATUS:', packet.source, keys[i]);
        devices[deviceId].powerStatus = keys[i];
        break;
      }
    }
  });

  cec.on('REPORT_PHYSICAL_ADDRESS', (packet, source, deviceType) => {
    const deviceId = parseInt(packet.source, 16);
    devices[deviceId].physicalAddress = source;
    devices[deviceId].deviceType = DEVICE_TYPES[deviceType];
    console.log('REPORT_PHYSICAL_ADDRESS', packet.source, source, other);
  })

  cec.on('ROUTING_CHANGE', function(packet, fromSource, toSource) {
    console.log( 'Routing changed from ' + fromSource + ' to ' + toSource + '.' );
  });

  cec.on('SET_OSD_NAME', (packet, osdname) => {
    const deviceId = parseInt(packet.source, 16);
    console.log('SET_OSD_NAME', packet.source, osdname);
    devices[deviceId].osdName = osdname;    
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
      if (interval) clearInterval(interval);
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
