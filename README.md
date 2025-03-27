# Agricultural Management System - MQTT Setup

This repository contains the setup for an MQTT-based agricultural management system that monitors sensor data and controls devices in agricultural settings.

## System Components

1. **MQTT Broker**: Eclipse Mosquitto running in Docker
2. **Sensor Simulator**: Simulates sensor data from agricultural nodes
3. **Device Controller**: Manages device state and automatic control based on sensor readings
4. **Test Client**: For testing MQTT connections and messages

## Setup Instructions

### Prerequisites

- Docker and Docker Compose
- Node.js (v10 or higher)
- npm

### Starting the MQTT Broker

```bash
npm run start-broker
# Or directly with
docker-compose up -d
```

This will start the Mosquitto MQTT broker on port 1883 (MQTT) and 9001 (WebSockets).

### Running the Sensor Simulator

```bash
npm run simulator
# Or directly with
node mqtt-sensor-simulator.js
```

This will:
- Connect to the MQTT broker
- Load node data from `src/data/nodes.json`
- Publish simulated sensor data to topics like `agrisys/nodes/{nodeId}/sensors`
- Update sensor values with random variations every 5 seconds

### Running the Device Controller

```bash
npm run controller
# Or directly with
node mqtt-device-controller.js
```

This will:
- Connect to the MQTT broker
- Subscribe to device command topics
- Handle device commands
- Automatically activate devices based on sensor readings
- Publish device status to appropriate topics

## MQTT Topics

- `agrisys/nodes/+/sensors`: Sensor data from nodes
- `agrisys/nodes/+/controls`: Control status from nodes
- `agrisys/nodes/+/command`: Commands to nodes
- `agrisys/nodes/+/device/command`: Device commands to nodes
- `agrisys/nodes/+/device/status`: Device status from nodes

## Testing the MQTT Setup

### Using the broker test script

```bash
npm run test
# Or directly with
node mqtt-broker-test.js
```

### Using the MQTT Web Client (included in Docker Compose)

```bash
docker exec -it agrisys-mqtt-web-client mqtt-cli
```

Then subscribe to topics:

```
mqtt> subscribe agrisys/nodes/#
```

## Stopping the MQTT Broker

```bash
npm run stop-broker
# Or directly with
docker-compose down
```

## Automatic Device Control

The device controller implements automatic device control based on sensor readings:

- Watering device activates when soil moisture falls below 40%
- Humidity device activates when humidity falls below 60%
- Devices automatically deactivate after a set runtime (5 minutes for watering, 10 minutes for humidity)
