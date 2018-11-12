const nodecec = require('node-cec');
const { EventEmitter } = require('events');
const NodeCec = nodecec.NodeCec;
const CEC = nodecec.CEC;
const DEVICE_TYPES = {
  '0': 'TV',
  '1': 'RECORDINGDEVICE',
  '2': 'RESERVED',
  '3': 'TUNER',
  '4': 'PLAYBACKDEVICE',
  '5': 'AUDIOSYSTEM'
};

exports.create = ({ config }) => {
  const devices = {};
  let active;
  const evt = new EventEmitter();
  let interval;

  Object.keys(CEC.LogicalAddress).forEach(name => {
    const device = { name };
    const id = CEC.LogicalAddress[name];
    devices[id] = device;
  });

  const cec = new NodeCec('node-cec-monitor');

  cec.once('ready', function(client) {
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
        const powerStatus = keys[i];
        console.log('POWER_STATUS:', packet.source, powerStatus);
        devices[deviceId].powerStatus = powerStatus;
        evt.emit(deviceId + '.power', { status: powerStatus })
        break;
      }
    }
  });

  cec.on('REPORT_PHYSICAL_ADDRESS', (packet, source, deviceType) => {
    const deviceId = parseInt(packet.source, 16);
    let sourceBytes;

    const firstByte = (source >> 8) & 0xff;
    const secondByte = source & 0xff;

    if (firstByte === 0) sourceBytes = [secondByte];
    else sourceBytes = [firstByte, secondByte];

    devices[deviceId].physicalAddress = source;
    devices[deviceId].physicalAddressBytes = sourceBytes;
    const type = DEVICE_TYPES[deviceType]
    devices[deviceId].deviceType = type;

    console.log('REPORT_PHYSICAL_ADDRESS', packet.source, source.toString(16), type);
    evt.emit(deviceId + '.physicaladdress', {
      physicalAddress: devices[deviceId].physicalAddress,
      physicalAddressBytes: devices[deviceId].physicalAddressBytes,
      type: devices[deviceId].deviceType
    })
  })

  cec.on('ROUTING_CHANGE', function(packet, fromSource, toSource) {
    console.log( 'Routing changed from ' + fromSource + ' to ' + toSource + '.' );
  });

  cec.on('SET_OSD_NAME', (packet, osdname) => {
    const deviceId = parseInt(packet.source, 16);
    console.log('SET_OSD_NAME', packet.source, osdname);
    devices[deviceId].osdName = osdname;
    evt.emit(deviceId + '.name', { osdName: osdname })
  });

  cec.on('ACTIVE_SOURCE', (packet, source) => {
    const deviceId = parseInt(packet.source, 16);
    active = deviceId;
    console.log('ACTIVE_SOURCE', packet, source);
    const { osdName, deviceType, powerStatus: status } = devices[deviceId];
    evt.emit(deviceId + ".active", { osdName, deviceType, status });
    evt.emit("active", { osdName, deviceType, status: status, id: deviceId });
  });

  // TODO:
  // function getPhysicalDeviceId(deviceId) {
  //   return new Promise((resolve, reject) => {
  //     cec.sendCommand(parseInt(`0x${deviceId}f`, 16), 0x82, physicalDeviceId);
  //   });
  // }

  return {
    on: evt.on.bind(evt),
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
    sendRaw(message) {
      cec.send('tx ' + message);
    },
    turnOn(device) {
      console.log(`Turning on ${device}`);
      return cec.send(`on ${getDeviceId(device)}`);
    },
    turnOff(device) {
      console.log(`Turning off ${device}`);
      return cec.send(`standby ${getDeviceId(device)}`);
    },
    setActiveSource(device) {
      console.log(`Setting active source to ${device}`);
      const deviceId = getDeviceId(device);
      const details = devices[deviceId];
      if (!details || !details.physicalAddressBytes) return;

      const byte1 = details.physicalAddressBytes[0];
      const byte2 = details.physicalAddressBytes.length > 1 ? details.physicalAddressBytes[1] : 0;
      return cec.sendCommand((deviceId << 4) + 15, 0x82, byte1, byte2);
    },
    turnAudioOn() {
      console.log('Turning audio on');
      return cec.sendCommand(0xef, 0x72, 1);
    },
    turnAudioOff() {
      console.log('Turning audio off');
      return cec.sendCommand(0xef, 0x72, 0);
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
