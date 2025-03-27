# MQTT Broker Setup for Agricultural Management System

This document provides instructions for setting up and using the MQTT broker for the Agricultural Management System.

## Overview

The system uses MQTT (Message Queuing Telemetry Transport) protocol for communication between the server and agricultural nodes. The MQTT broker is responsible for routing messages between publishers and subscribers.

## Components

1. **MQTT Broker (Mosquitto)**: A lightweight message broker that implements the MQTT protocol.
2. **MQTT Web Client**: A command-line interface for debugging MQTT messages.
3. **Sensor Simulator**: A script that simulates sensor data from agricultural nodes.
4. **Device Controller**: A script that simulates device control (watering and humidity systems).

## Setup Instructions

### Prerequisites

- Docker and Docker Compose installed
- Node.js (v14 or higher)

### Starting the MQTT Broker

1. Start the MQTT broker using Docker Compose:

```bash
docker-compose up -d
```

This will start the Mosquitto MQTT broker on port 1883 (MQTT) and 9001 (WebSockets).

### Running the Sensor Simulator

The sensor simulator sends simulated sensor data to the MQTT broker:

```bash
node mqtt-sensor-simulator.js
```

This script will:
- Connect to the MQTT broker
- Load node data from `src/data/nodes.json`
- Publish simulated sensor data to topics like `agrisys/nodes/{nodeId}/sensors`
- Update sensor values with random variations every 5 seconds

### Running the Device Controller

The device controller simulates agricultural devices that can be controlled via MQTT:

```bash
node mqtt-device-controller.js
```

This script will:
- Connect to the MQTT broker
- Subscribe to device command topics
- Handle device commands from the web interface
- Automatically activate devices based on sensor readings (e.g., activate watering when soil moisture is low)
- Publish device status to topics like `agrisys/nodes/{nodeId}/device/status`

## MQTT Topics

The system uses the following MQTT topics:

- `agrisys/nodes/+/sensors`: Sensor data from nodes
- `agrisys/nodes/+/controls`: Control status from nodes
- `agrisys/nodes/+/command`: Commands to nodes
- `agrisys/nodes/+/device/command`: Device commands to nodes
- `agrisys/nodes/+/device/status`: Device status from nodes

Where `+` is a wildcard that represents the node ID.

## Testing the MQTT Setup

1. Start the MQTT broker using Docker Compose
2. Run the sensor simulator
3. Run the device controller
4. Start the web server
5. Open the web interface and navigate to a node's detail page
6. Use the device controls to toggle watering or humidity devices
7. Observe the device status updates in real-time

## Debugging

You can use the MQTT Web Client included in the Docker Compose setup to debug MQTT messages:

```bash
docker exec -it agrisys-mqtt-web-client mqtt-cli
```

Then you can subscribe to topics:

```
mqtt> subscribe agrisys/nodes/#
```

This will show all messages published to the agrisys/nodes/ topics.

## Automatic Device Control

The device controller implements automatic device control based on sensor readings:

- Watering device activates when soil moisture falls below 40%
- Humidity device activates when humidity falls below 60%
- Devices automatically deactivate after a set runtime (5 minutes for watering, 10 minutes for humidity)

You can switch between automatic and manual control modes using the device controls in the web interface.
