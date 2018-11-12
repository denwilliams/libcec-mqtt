# libcec-mqtt
Node.js MQTT bridge for Raspberry Pi

## Topics 

### Input

#### ${topicPrefix}/device/${id}/input/on

#### ${topicPrefix}/device/${id}/input/off

#### ${topicPrefix}/device/${id}/input/active

NOTE: can be temperamental

#### ${topicPrefix}/device/audio/input/on

#### ${topicPrefix}/device/audio/input/off

#### ${topicPrefix}/input/raw

### Output

#### ${topicPrefix}/cec/${id}/power

```
{"status":"ON","timestamp":"2018-11-12T09:41:46.493Z"}
```

### ${topicPrefix}/cec/${id}/physicaladdress

```
{"physicalAddress":8192,"physicalAddressBytes":[32,0],"type":"AUDIOSYSTEM","timestamp":"2018-11-12T09:41:49.028Z"}
```

### ${topicPrefix}/cec/${id}/name

```
{"osdName":"TV","timestamp":"2018-11-12T10:13:24.675Z"}
```

### ${topicPrefix}/cec/${id}/active

Fired when this device becomes active.

### ${topicPrefix}/cec/active

Fired when the active device changes. Payload contains ID.
