const mqtt = require('mqtt');

const logger = require('./logger');
const DEVICE_IDS = Array.from(new Array(16), (x,i) => i);

exports.create = ({ config, cecApi }) => {
  let mqttClient;
  let mqttConnected = false;

  const mqttUri = 'mqtt://' + config.get('mqtt.host');
  const topicPrefix = config.get('mqtt.topic_prefix');

  const service = {};

  DEVICE_IDS.forEach(id => {
    ['power', 'physicaladdress', 'name'].forEach(name => {
      cecApi.on(`${id}.${name}`, (data) => service.emit(`${id}/${name}`, data));
    });
  });

  function turnDeviceOn(deviceId) {
    cecApi.turnOn(deviceId);
  }

  function turnDeviceOff(deviceId) {
    cecApi.turnOff(deviceId);
  }

  function turnAudioOn() {
    cecApi.turnAudioOn();
  }

  function turnAudioOff() {
    cecApi.turnAudioOff();
  }

  function setActive(deviceId) {
    cecApi.setActiveSource(deviceId);
  }

  function rawInput(message) {
    cecApi.sendRaw(message);
  }

  service.start = () => {
    mqttClient  = mqtt.connect(mqttUri);

    const handlers = {};

    function subscribe(topic, handler) {
      handlers[topic] = handler;
      mqttClient.subscribe(topic);
    }

    mqttClient.on('message', (topic, message) => {
      const handler = handlers[topic];
      if (!handler) return;
      const strMsg = message.toString();
      const data = strMsg ? JSON.parse(strMsg) : undefined;
      handler(data);
    });

    mqttClient.on('connect', () => {
      logger.info('MQTT connected');
      mqttConnected = true;

      DEVICE_IDS.forEach(id => {
        subscribe(`${topicPrefix}/device/${id}/input/on`, turnDeviceOn.bind(null, id));
        subscribe(`${topicPrefix}/device/${id}/input/off`, turnDeviceOff.bind(null, id));
        subscribe(`${topicPrefix}/device/${id}/input/active`, setActive.bind(null, id));
      });
      subscribe(`${topicPrefix}/device/audio/input/on`, turnAudioOn);
      subscribe(`${topicPrefix}/device/audio/input/off`, turnAudioOff);
      subscribe(`${topicPrefix}/input/raw`, rawInput);
    });

    mqttClient.on('close', console.log);
    mqttClient.on('offline', console.log);
    // mqttClient.on('error', console.error);
    // mqttClient.on('message', console.log);

    // mqttClient.on('message', function (topic, message) {
    //   // message is Buffer
    //   console.log(message.toString())
    // })
  };

  service.stop = () => {
  };

  service.emit = (event, valueMap) => {
    if (!mqttConnected) return;

    const topic = `${topicPrefix}/${event}`;
    const data = Object.assign({}, valueMap, { timestamp: new Date() });

    mqttClient.publish(topic, JSON.stringify(data));
    logger.info(`Publish: ${topic} ${JSON.stringify(data)}`);
  };

  return service;
};
