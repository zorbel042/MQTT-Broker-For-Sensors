# MQTT Broker Setup on Raspberry Pi 4 for Agricultural Management System

This guide provides comprehensive instructions for setting up an MQTT broker on a Raspberry Pi 4 for the Agricultural Management System, replacing the Docker-based setup with a native installation.

## Table of Contents

1. [Hardware Requirements](#hardware-requirements)
2. [Flashing Raspberry Pi OS](#flashing-raspberry-pi-os)
3. [Initial Setup and Configuration](#initial-setup-and-configuration)
4. [Installing Required Software](#installing-required-software)
5. [Configuring the MQTT Broker](#configuring-the-mqtt-broker)
6. [Setting Up Node.js Applications](#setting-up-nodejs-applications)
7. [Creating Initialization and Service Scripts](#creating-initialization-and-service-scripts)
8. [Testing the Setup](#testing-the-setup)
9. [Troubleshooting](#troubleshooting)

## Hardware Requirements

- Raspberry Pi 4 (2GB RAM or higher recommended)
- MicroSD card (16GB or larger recommended)
- Power supply for Raspberry Pi 4 (USB-C, 5V/3A)
- Ethernet cable or Wi-Fi connectivity
- Optional: Case for Raspberry Pi
- Computer with SD card reader for flashing the OS

## Flashing Raspberry Pi OS

1. **Download Raspberry Pi Imager**:
   - Visit [https://www.raspberrypi.com/software/](https://www.raspberrypi.com/software/)
   - Download and install the Raspberry Pi Imager for your operating system

2. **Flash Raspberry Pi OS**:
   - Insert your microSD card into your computer
   - Launch Raspberry Pi Imager
   - Click "CHOOSE OS" and select "Raspberry Pi OS (64-bit)" (recommended for Pi 4)
   - Click "CHOOSE STORAGE" and select your microSD card
   - Click the gear icon (⚙️) to access advanced options:
     - Set hostname: `agrisys-mqtt-server`
     - Enable SSH
     - Set username and password (default: username `pi`, but choose a secure password)
     - Configure Wi-Fi (if not using Ethernet)
     - Set locale settings
   - Click "SAVE" to save these settings
   - Click "WRITE" to flash the OS to the microSD card
   - Wait for the process to complete and click "CONTINUE"

3. **Boot Raspberry Pi**:
   - Insert the microSD card into your Raspberry Pi 4
   - Connect power, network, and any peripherals
   - Power on the Raspberry Pi

## Initial Setup and Configuration

1. **Connect to Raspberry Pi**:
   - If you configured SSH in the previous step, you can connect remotely:
   ```bash
   ssh pi@agrisys-mqtt-server.local
   ```
   - Enter the password you set during the flashing process

2. **Update the System**:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

3. **Set Up Firewall**:
   ```bash
   sudo apt install -y ufw
   sudo ufw allow ssh
   sudo ufw allow 1883  # MQTT
   sudo ufw allow 9001  # MQTT WebSockets
   sudo ufw enable
   ```

## Installing Required Software

1. **Install Mosquitto MQTT Broker**:
   ```bash
   sudo apt install -y mosquitto mosquitto-clients
   ```

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Verify Installations**:
   ```bash
   mosquitto -v
   node -v
   npm -v
   ```

## Configuring the MQTT Broker

1. **Create Mosquitto Configuration Directory**:
   ```bash
   sudo mkdir -p /etc/mosquitto/conf.d
   ```

2. **Create Mosquitto Configuration File**:
   ```bash
   sudo nano /etc/mosquitto/conf.d/agrisys.conf
   ```

3. **Add the Following Configuration**:
   ```
   # Basic Configuration
   listener 1883
   protocol mqtt

   # WebSockets support
   listener 9001
   protocol websockets

   # Persistence settings
   persistence true
   persistence_location /var/lib/mosquitto/
   persistence_file mosquitto.db

   # Logging settings
   log_dest file /var/log/mosquitto/mosquitto.log
   log_dest stdout
   log_type all
   connection_messages true

   # Security settings (no authentication for development)
   # For production, consider setting up proper authentication
   allow_anonymous true

   # Performance settings
   max_queued_messages 1000
   max_inflight_messages 20
   ```

4. **Create Log Directory**:
   ```bash
   sudo mkdir -p /var/log/mosquitto
   sudo chown mosquitto:mosquitto /var/log/mosquitto
   ```

5. **Network Configuration**:
   
   By default, the Mosquitto configuration above makes the MQTT broker accessible from the local network, not just from the Raspberry Pi itself. This enables:
   
   - Agricultural nodes to connect from anywhere on the local network
   - Remote monitoring and control from other computers on the network
   - Integration with other systems and devices on the network
   
   To connect from another device on the network, use the Raspberry Pi's IP address:
   ```
   mqtt://[raspberry-pi-ip-address]:1883
   ```
   
   You can find your Raspberry Pi's IP address using:
   ```bash
   hostname -I
   ```

6. **Restart Mosquitto Service**:
   ```bash
   sudo systemctl restart mosquitto
   sudo systemctl enable mosquitto
   ```

## Setting Up Node.js Applications

1. **Create Project Directory**:
   ```bash
   mkdir -p ~/agrisys
   cd ~/agrisys
   ```

2. **Initialize Node.js Project**:
   ```bash
   npm init -y
   ```

3. **Install Required Packages**:
   ```bash
   npm install mqtt
   ```

4. **Create Data Directory and Node Data File**:
   ```bash
   mkdir -p src/data
   nano src/data/nodes.json
   ```

5. **Add the Following Node Data**:
   ```json
   [
     {
       "id": "node-001",
       "name": "Garden Bed 1",
       "location": "East Field",
       "status": "online",
       "lastUpdated": "2025-03-27T00:00:00.000Z",
       "sensors": {
         "soilMoisture": {
           "value": 65.5,
           "unit": "%",
           "status": "optimal"
         },
         "light": {
           "value": 850,
           "unit": "lux",
           "status": "optimal"
         },
         "humidity": {
           "value": 62.3,
           "unit": "%",
           "status": "optimal"
         },
         "temperature": {
           "value": 22.4,
           "unit": "°C",
           "status": "optimal"
         }
       },
       "controls": {
         "watering": {
           "isActive": false,
           "mode": "auto"
         },
         "lighting": {
           "isActive": false,
           "mode": "auto"
         }
       },
       "devices": {
         "watering": {
           "isActive": false,
           "mode": "auto",
           "lastActivated": null
         },
         "humidity": {
           "isActive": false,
           "mode": "auto",
           "lastActivated": null
         }
       }
     },
     {
       "id": "node-002",
       "name": "Garden Bed 2",
       "location": "West Field",
       "status": "online",
       "lastUpdated": "2025-03-27T00:00:00.000Z",
       "sensors": {
         "soilMoisture": {
           "value": 35.8,
           "unit": "%",
           "status": "low"
         },
         "light": {
           "value": 920,
           "unit": "lux",
           "status": "optimal"
         },
         "humidity": {
           "value": 58.7,
           "unit": "%",
           "status": "optimal"
         },
         "temperature": {
           "value": 23.1,
           "unit": "°C",
           "status": "optimal"
         }
       },
       "controls": {
         "watering": {
           "isActive": true,
           "mode": "auto"
         },
         "lighting": {
           "isActive": false,
           "mode": "auto"
         }
       },
       "devices": {
         "watering": {
           "isActive": true,
           "mode": "auto",
           "lastActivated": "2025-03-27T00:00:00.000Z"
         },
         "humidity": {
           "isActive": false,
           "mode": "auto",
           "lastActivated": null
         }
       }
     },
     {
       "id": "node-003",
       "name": "Greenhouse",
       "location": "North Field",
       "status": "online",
       "lastUpdated": "2025-03-27T00:00:00.000Z",
       "sensors": {
         "soilMoisture": {
           "value": 70.2,
           "unit": "%",
           "status": "high"
         },
         "light": {
           "value": 1100,
           "unit": "lux",
           "status": "optimal"
         },
         "humidity": {
           "value": 55.4,
           "unit": "%",
           "status": "optimal"
         },
         "temperature": {
           "value": 24.8,
           "unit": "°C",
           "status": "optimal"
         }
       },
       "controls": {
         "watering": {
           "isActive": false,
           "mode": "auto"
         },
         "lighting": {
           "isActive": true,
           "mode": "auto"
         }
       },
       "devices": {
         "watering": {
           "isActive": false,
           "mode": "auto",
           "lastActivated": null
         },
         "humidity": {
           "isActive": true,
           "mode": "auto",
           "lastActivated": "2025-03-27T00:00:00.000Z"
         }
       }
     }
   ]
   ```

6. **Create Sensor Simulator Script**:
   ```bash
   nano mqtt-sensor-simulator.js
   ```

7. **Add the Following Code**:
   ```javascript
   /**
    * MQTT Sensor Simulator for Agricultural Management System
    *
    * This script simulates agricultural nodes sending sensor data to the MQTT broker.
    * It can be used to test the real-time capabilities of the system.
    */

   const mqtt = require('mqtt');
   const fs = require('fs');
   const path = require('path');

   // Configuration
   const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
   const DATA_FILE = path.join(__dirname, 'src/data/nodes.json');
   const UPDATE_INTERVAL = 5000; // 5 seconds

   // MQTT Topics
   const TOPICS = {
     SENSOR_DATA: 'agrisys/nodes/{nodeId}/sensors',
     CONTROL_STATUS: 'agrisys/nodes/{nodeId}/controls',
     COMMAND: 'agrisys/nodes/{nodeId}/command'
   };

   // Connect to MQTT broker
   console.log(`Connecting to MQTT broker at ${MQTT_BROKER}...`);
   const client = mqtt.connect(MQTT_BROKER);

   // Load initial node data
   let nodes = [];
   try {
     const data = fs.readFileSync(DATA_FILE, 'utf8');
     nodes = JSON.parse(data);
     console.log(`Loaded ${nodes.length} nodes from ${DATA_FILE}`);

     // Initialize sensor history if not present
     nodes.forEach(node => {
       Object.keys(node.sensors).forEach(sensorType => {
         if (!node.sensors[sensorType].history) {
           node.sensors[sensorType].history = [];
         }
       });
     });
   } catch (error) {
     console.error(`Error loading node data: ${error.message}`);
     process.exit(1);
   }

   // Handle connection events
   client.on('connect', () => {
     console.log('Connected to MQTT broker');

     // Subscribe to command topics for all nodes
     nodes.forEach(node => {
       const commandTopic = TOPICS.COMMAND.replace('{nodeId}', node.id);
       client.subscribe(commandTopic, (err) => {
         if (err) {
           console.error(`Error subscribing to ${commandTopic}:`, err);
         } else {
           console.log(`Subscribed to ${commandTopic}`);
         }
       });
     });

     // Start publishing simulated sensor data
     startSimulation();
   });

   client.on('error', (error) => {
     console.error('MQTT connection error:', error);
   });

   client.on('message', (topic, message) => {
     try {
       const payload = JSON.parse(message.toString());
       console.log(`Received command on ${topic}:`, payload);

       // Extract node ID from topic
       const topicParts = topic.split('/');
       const nodeId = topicParts[2];

       // Handle command
       handleCommand(nodeId, payload);
     } catch (error) {
       console.error('Error processing command:', error);
     }
   });

   /**
    * Handle command received from the server
    * @param {string} nodeId - Node ID
    * @param {Object} command - Command data
    */
   function handleCommand(nodeId, command) {
     const node = nodes.find(n => n.id === nodeId);
     if (!node) {
       console.error(`Node ${nodeId} not found`);
       return;
     }

     if (command.control && command.value) {
       // Update control status
       if (!node.controls[command.control]) {
         node.controls[command.control] = {};
       }

       node.controls[command.control] = {
         ...node.controls[command.control],
         ...command.value
       };

       console.log(`Updated ${command.control} control for node ${nodeId}:`, node.controls[command.control]);

       // Publish updated control status
       publishControlStatus(node);
     }
   }

   /**
    * Start simulation of sensor data
    */
   function startSimulation() {
     console.log('Starting sensor data simulation...');

     // Publish initial data
     nodes.forEach(node => {
       publishSensorData(node);
       publishControlStatus(node);
     });

     // Set up interval for regular updates
     setInterval(() => {
       nodes.forEach(node => {
         // Skip offline nodes
         if (node.status === 'offline') {
           return;
         }

         // Update sensor values with random variations
         updateSensorValues(node);

         // Publish updated sensor data
         publishSensorData(node);
       });
     }, UPDATE_INTERVAL);
   }

   /**
    * Update sensor values with random variations
    * @param {Object} node - Node data
    */
   function updateSensorValues(node) {
     // Helper function to get random value within range
     const getRandomValue = (value, range) => {
       const min = value - range;
       const max = value + range;
       return parseFloat((Math.random() * (max - min) + min).toFixed(1));
     };

     // Update soil moisture
     if (node.sensors.soilMoisture) {
       const newValue = getRandomValue(node.sensors.soilMoisture.value, 2);

       // Add to history before updating value
       updateSensorHistory(node.sensors.soilMoisture, node.sensors.soilMoisture.value);

       node.sensors.soilMoisture.value = Math.min(100, Math.max(0, newValue));

       // Update status based on value
       if (node.sensors.soilMoisture.value < 40) {
         node.sensors.soilMoisture.status = 'low';
       } else if (node.sensors.soilMoisture.value > 70) {
         node.sensors.soilMoisture.status = 'high';
       } else {
         node.sensors.soilMoisture.status = 'optimal';
       }
     }

     // Update light
     if (node.sensors.light) {
       // During day (6am-8pm) light values are higher
       const hour = new Date().getHours();
       const isDaytime = hour >= 6 && hour <= 20;

       // Add to history before updating value
       updateSensorHistory(node.sensors.light, node.sensors.light.value);

       if (isDaytime) {
         const newValue = getRandomValue(node.sensors.light.value, 50);
         node.sensors.light.value = Math.max(0, newValue);
       } else {
         node.sensors.light.value = Math.max(0, getRandomValue(10, 5));
       }

       // Update status based on value
       if (node.sensors.light.value < 200) {
         node.sensors.light.status = 'low';
       } else if (node.sensors.light.value > 1200) {
         node.sensors.light.status = 'high';
       } else {
         node.sensors.light.status = 'optimal';
       }
     }

     // Update humidity
     if (node.sensors.humidity) {
       const newValue = getRandomValue(node.sensors.humidity.value, 1);

       // Add to history before updating value
       updateSensorHistory(node.sensors.humidity, node.sensors.humidity.value);

       node.sensors.humidity.value = Math.min(100, Math.max(0, newValue));

       // Update status based on value
       if (node.sensors.humidity.value < 50) {
         node.sensors.humidity.status = 'low';
       } else if (node.sensors.humidity.value > 75) {
         node.sensors.humidity.status = 'high';
       } else {
         node.sensors.humidity.status = 'optimal';
       }
     }

     // Update temperature
     if (node.sensors.temperature) {
       const newValue = getRandomValue(node.sensors.temperature.value, 0.2);

       // Add to history before updating value
       updateSensorHistory(node.sensors.temperature, node.sensors.temperature.value);

       node.sensors.temperature.value = newValue;

       // Update status based on value
       if (node.sensors.temperature.value < 18) {
         node.sensors.temperature.status = 'low';
       } else if (node.sensors.temperature.value > 28) {
         node.sensors.temperature.status = 'high';
       } else {
         node.sensors.temperature.status = 'optimal';
       }
     }

     // Update last updated timestamp
     node.lastUpdated = new Date().toISOString();
   }

   /**
    * Update sensor history
    * @param {Object} sensor - Sensor object
    * @param {number} value - Current value to add to history
    */
   function updateSensorHistory(sensor, value) {
     if (!sensor.history) {
       sensor.history = [];
     }

     // Add current value to history
     sensor.history.push({
       value: value,
       timestamp: new Date().toISOString()
     });

     // Keep only the last 5 readings
     if (sensor.history.length > 5) {
       sensor.history.shift();
     }
   }

   /**
    * Publish sensor data to MQTT broker
    * @param {Object} node - Node data
    */
   function publishSensorData(node) {
     const topic = TOPICS.SENSOR_DATA.replace('{nodeId}', node.id);
     const payload = JSON.stringify(node.sensors);

     client.publish(topic, payload, { qos: 0, retain: false }, (err) => {
       if (err) {
         console.error(`Error publishing sensor data for node ${node.id}:`, err);
       } else {
         console.log(`Published sensor data for node ${node.id}`);
       }
     });
   }

   /**
    * Publish control status to MQTT broker
    * @param {Object} node - Node data
    */
   function publishControlStatus(node) {
     const topic = TOPICS.CONTROL_STATUS.replace('{nodeId}', node.id);
     const payload = JSON.stringify(node.controls);

     client.publish(topic, payload, { qos: 0, retain: false }, (err) => {
       if (err) {
         console.error(`Error publishing control status for node ${node.id}:`, err);
       } else {
         console.log(`Published control status for node ${node.id}`);
       }
     });
   }

   // Handle process termination
   process.on('SIGINT', () => {
     console.log('Disconnecting from MQTT broker...');
     client.end();
     process.exit();
   });
   ```

8. **Create Device Controller Script**:
   ```bash
   nano mqtt-device-controller.js
   ```

9. **Add the Following Code**:
   ```javascript
   /**
    * MQTT Device Controller for Agricultural Management System
    *
    * This script simulates agricultural devices (watering and humidity systems)
    * that can be controlled via MQTT commands.
    */

   const mqtt = require('mqtt');
   const fs = require('fs');
   const path = require('path');

   // Configuration
   const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';
   const DATA_FILE = path.join(__dirname, 'src/data/nodes.json');

   // MQTT Topics
   const TOPICS = {
     DEVICE_COMMAND: 'agrisys/nodes/+/device/command',
     DEVICE_STATUS: 'agrisys/nodes/+/device/status',
     SENSOR_DATA: 'agrisys/nodes/+/sensors'
   };

   // Connect to MQTT broker
   console.log(`Connecting to MQTT broker at ${MQTT_BROKER}...`);
   const client = mqtt.connect(MQTT_BROKER);

   // Load initial node data
   let nodes = [];
   try {
     const data = fs.readFileSync(DATA_FILE, 'utf8');
     nodes = JSON.parse(data);
     console.log(`Loaded ${nodes.length} nodes from ${DATA_FILE}`);

     // Initialize device states if not present
     nodes.forEach(node => {
       if (!node.devices) {
         node.devices = {
           watering: {
             isActive: false,
             mode: 'auto',
             lastActivated: null
           },
           humidity: {
             isActive: false,
             mode: 'auto',
             lastActivated: null
           }
         };
       }
     });
   } catch (error) {
     console.error(`Error loading node data: ${error.message}`);
     process.exit(1);
   }

   // Handle connection events
   client.on('connect', () => {
     console.log('Connected to MQTT broker');

     // Subscribe to device command topics for all nodes
     client.subscribe(TOPICS.DEVICE_COMMAND, (err) => {
       if (err) {
         console.error(`Error subscribing to ${TOPICS.DEVICE_COMMAND}:`, err);
       } else {
         console.log(`Subscribed to ${TOPICS.DEVICE_COMMAND}`);
       }
     });

     // Subscribe to sensor data to trigger automatic device activation
     client.subscribe(TOPICS.SENSOR_DATA, (err) => {
       if (err) {
         console.error(`Error subscribing to ${TOPICS.SENSOR_DATA}:`, err);
       } else {
         console.log(`Subscribed to ${TOPICS.SENSOR_DATA}`);
       }
     });

     // Publish initial device status for all nodes
     publishAllDeviceStatus();

     // Start automatic device control
     startAutomaticControl();
   });

   client.on('error', (error) => {
     console.error('MQTT connection error:', error);
   });

   client.on('message', (topic, message) => {
     try {
       // Extract node ID from topic
       const topicParts = topic.split('/');
       const nodeId = topicParts[2];

       if (topic.includes('/device/command')) {
         // Handle device command
         const command = JSON.parse(message.toString());
         console.log(`Received device command for node ${nodeId}:`, command);
         handleDeviceCommand(nodeId, command);
       } else if (topic.includes('/sensors')) {
         // Handle sensor data for automatic device control
         const sensorData = JSON.parse(message.toString());
         handleSensorData(nodeId, sensorData);
       }
     } catch (error) {
       console.error('Error processing message:', error);
     }
   });

   /**
    * Handle device command
    * @param {string} nodeId - Node ID
    * @param {Object} command - Command data
    */
   function handleDeviceCommand(nodeId, command) {
     const node = nodes.find(n => n.id === nodeId);
     if (!node) {
       console.error(`Node ${nodeId} not found`);
       return;
     }

     // Initialize devices object if it doesn't exist
     if (!node.devices) {
       node.devices = {
         watering: {
           isActive: false,
           mode: 'auto',
           lastActivated: null
         },
         humidity: {
           isActive: false,
           mode: 'auto',
           lastActivated: null
         }
       };
     }

     // Get device type from command
     const { device } = command;
     if (!device || !node.devices[device]) {
       console.error(`Invalid device type: ${device}`);
       return;
     }

     // Update device state based on command
     if (command.state !== undefined) {
       node.devices[device].isActive = command.state;
       if (command.state) {
         node.devices[device].lastActivated = new Date().toISOString();
       }
     }

     if (command.mode) {
       node.devices[device].mode = command.mode;
     }

     // Publish updated device status
     publishDeviceStatus(node);

     console.log(`Updated ${device} device for node ${nodeId}:`, node.devices[device]);
   }

   /**
    * Handle sensor data for automatic device control
    * @param {string} nodeId - Node ID
    * @param {Object} sensorData - Sensor data
    */
   function handleSensorData(nodeId, sensorData) {
     const node = nodes.find(n => n.id === nodeId);
     if (!node || !node.devices) return;

     let deviceStateChanged = false;

     // Check if watering device should be activated based on soil moisture
     if (node.devices.watering.mode === 'auto' && sensorData.soilMoisture) {
       const shouldActivate = sensorData.soilMoisture.value < 40; // Activate if below 40%
       if (shouldActivate !== node.devices.watering.isActive) {
         node.devices.watering.isActive = shouldActivate;
         if (shouldActivate) {
           node.devices.watering.lastActivated = new Date().toISOString();
         }
         deviceStateChanged = true;
         console.log(`Auto ${shouldActivate ? 'activated' : 'deactivated'} watering for node ${nodeId} (soil moisture: ${sensorData.soilMoisture.value}%)`);
       }
     }

     // Check if humidity device should be activated based on humidity
     if (node.devices.humidity.mode === 'auto' && sensorData.humidity) {
       const shouldActivate = sensorData.humidity.value < 60; // Activate if below 60%
       if (shouldActivate !== node.devices.humidity.isActive) {
         node.devices.humidity.isActive = shouldActivate;
         if (shouldActivate) {
           node.devices.humidity.lastActivated = new Date().toISOString();
         }
         deviceStateChanged = true;
         console.log(`Auto ${shouldActivate ? 'activated' : 'deactivated'} humidity for node ${nodeId} (humidity: ${sensorData.humidity.value}%)`);
       }
     }

     // Publish device status if state changed
     if (deviceStateChanged) {
       publishDeviceStatus(node);
     }
   }

   /**
    * Publish device status for a node
    * @param {Object} node - Node data
    */
   function publishDeviceStatus(node) {
     const topic = `agrisys/nodes/${node.id}/device/status`;
     const payload = JSON.stringify(node.devices);

     client.publish(topic, payload, { qos: 0, retain: false }, (err) => {
       if (err) {
         console.error(`Error publishing device status for node ${node.id}:`, err);
       } else {
         console.log(`Published device status for node ${node.id}`);
       }
     });
   }

   /**
    * Publish device status for all nodes
    */
   function publishAllDeviceStatus() {
     nodes.forEach(node => {
       publishDeviceStatus(node);
     });
   }

   /**
    * Start automatic device control
    */
   function startAutomaticControl() {
     // Periodically check if devices should be deactivated
     setInterval(() => {
       const now = new Date();
       let stateChanged = false;

       nodes.forEach(node => {
         if (!node.devices) return;

         // Check watering device
         if (node.devices.watering.isActive && node.devices.watering.mode === 'auto') {
           const lastActivated = new Date(node.devices.watering.lastActivated || 0);
           const runTime = (now - lastActivated) / 1000 / 60; // in minutes

           // Deactivate after 5 minutes of runtime
           if (runTime > 5) {
             node.devices.watering.isActive = false;
             stateChanged = true;
             console.log(`Auto deactivated watering for node ${node.id} after ${Math.round(runTime)} minutes`);
           }
         }

         // Check humidity device
         if (node.devices.humidity.isActive && node.devices.humidity.mode === 'auto') {
           const lastActivated = new Date(node.devices.humidity.lastActivated || 0);
           const runTime = (now - lastActivated) / 1000 / 60; // in minutes

           // Deactivate after 10 minutes of runtime
           if (runTime > 10) {
             node.devices.humidity.isActive = false;
             stateChanged = true;
             console.log(`Auto deactivated humidity for node ${node.id} after ${Math.round(runTime)} minutes`);
           }
         }
       });

       // Publish device status if state changed
       if (stateChanged) {
         publishAllDeviceStatus();
       }
     }, 30000); // Check every 30 seconds
   }

   // Handle process termination
   process.on('SIGINT', () => {
     console.log('Disconnecting from MQTT broker...');
     client.end();
     process.exit();
   });
   ```

10. **Create Test Client Script**:
    ```bash
    nano mqtt-test-client.js
    ```

11. **Add the Following Code**:
    ```javascript
    /**
     * MQTT Test Client for Agricultural Management System
     *
     * This script provides a simple test client to verify MQTT broker connectivity
     * and subscribe to topics.
     */

    const mqtt = require('mqtt');

    // Configuration
    const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost:1883';

    // Connect to MQTT broker
    console.log(`Connecting to MQTT broker at ${MQTT_BROKER}...`);
    const client = mqtt.connect(MQTT_BROKER);

    // Handle connection events
    client.on('connect', () => {
      console.log('Connected to MQTT broker');

      // Subscribe to all agrisys topics
      client.subscribe('agrisys/#', (err) => {
        if (err) {
          console.error('Error subscribing to topics:', err);
        } else {
          console.log('Subscribed to all agrisys topics');
          console.log('Waiting for messages...');
        }
      });
    });

    client.on('error', (error) => {
      console.error('MQTT connection error:', error);
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log(`Received message on ${topic}:`, payload);
      } catch (error) {
        console.log(`Received message on ${topic}: ${message.toString()}`);
      }
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('Disconnecting from MQTT broker...');
      client.end();
      process.exit();
    });
    ```

## Creating Initialization and Service Scripts

1. **Create System Initialization Script**:
   ```bash
   nano init-agrisys.sh
   ```

2. **Add the Following Code**:
   ```bash
   #!/bin/bash
   # Initialization script for Agricultural Management System on Raspberry Pi
   # This script should be run once after setting up the Raspberry Pi

   # Exit on error
   set -e

   echo "Initializing Agricultural Management System..."

   # Update system
   echo "Updating system packages..."
   sudo apt update
   sudo apt upgrade -y

   # Install required packages
   echo "Installing required packages..."
   sudo apt install -y mosquitto mosquitto-clients ufw

   # Install Node.js
   echo "Installing Node.js..."
   if ! command -v node &> /dev/null; then
     curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
     sudo apt install -y nodejs
   fi

   # Configure firewall
   echo "Configuring firewall..."
   sudo ufw allow ssh
   sudo ufw allow 1883  # MQTT
   sudo ufw allow 9001  # MQTT WebSockets
   sudo ufw --force enable

   # Configure Mosquitto
   echo "Configuring Mosquitto MQTT broker..."
   sudo mkdir -p /etc/mosquitto/conf.d
   
   # Create Mosquitto configuration
   cat << EOF | sudo tee /etc/mosquitto/conf.d/agrisys.conf
   # Basic Configuration
   listener 1883
   protocol mqtt

   # WebSockets support
   listener 9001
   protocol websockets

   # Persistence settings
   persistence true
   persistence_location /var/lib/mosquitto/
   persistence_file mosquitto.db

   # Logging settings
   log_dest file /var/log/mosquitto/mosquitto.log
   log_dest stdout
   log_type all
   connection_messages true

   # Security settings (no authentication for development)
   # For production, consider setting up proper authentication
   allow_anonymous true

   # Performance settings
   max_queued_messages 1000
   max_inflight_messages 20
   EOF

   # Create log directory
   sudo mkdir -p /var/log/mosquitto
   sudo chown mosquitto:mosquitto /var/log/mosquitto

   # Restart and enable Mosquitto
   echo "Starting Mosquitto service..."
   sudo systemctl restart mosquitto
   sudo systemctl enable mosquitto

   # Create logs directory
   mkdir -p ~/agrisys/logs

   # Create systemd service files for Node.js applications
   echo "Creating systemd service files..."

   # Sensor simulator service
   cat << EOF | sudo tee /etc/systemd/system/agrisys-sensor-simulator.service
   [Unit]
   Description=Agricultural Management System Sensor Simulator
   After=network.target mosquitto.service
   Wants=mosquitto.service

   [Service]
   Type=simple
   User=$USER
   WorkingDirectory=/home/$USER/agrisys
   ExecStart=/usr/bin/node /home/$USER/agrisys/mqtt-sensor-simulator.js
   Restart=on-failure
   StandardOutput=append:/home/$USER/agrisys/logs/sensor.log
   StandardError=append:/home/$USER/agrisys/logs/sensor.log

   [Install]
   WantedBy=multi-user.target
   EOF

   # Device controller service
   cat << EOF | sudo tee /etc/systemd/system/agrisys-device-controller.service
   [Unit]
   Description=Agricultural Management System Device Controller
   After=network.target mosquitto.service
   Wants=mosquitto.service

   [Service]
   Type=simple
   User=$USER
   WorkingDirectory=/home/$USER/agrisys
   ExecStart=/usr/bin/node /home/$USER/agrisys/mqtt-device-controller.js
   Restart=on-failure
   StandardOutput=append:/home/$USER/agrisys/logs/controller.log
   StandardError=append:/home/$USER/agrisys/logs/controller.log

   [Install]
   WantedBy=multi-user.target
   EOF

   # Reload systemd
   sudo systemctl daemon-reload

   # Enable services to start on boot
   sudo systemctl enable agrisys-sensor-simulator.service
   sudo systemctl enable agrisys-device-controller.service

   echo "Initialization complete!"
   echo "You can now start the services with:"
   echo "sudo systemctl start agrisys-sensor-simulator.service"
   echo "sudo systemctl start agrisys-device-controller.service"
   ```

3. **Make the Initialization Script Executable**:
   ```bash
   chmod +x init-agrisys.sh
   ```

4. **Create Management Script**:
   ```bash
   nano agrisys-manager.sh
   ```

5. **Add the Following Code**:
   ```bash
   #!/bin/bash
   # Management script for Agricultural Management System
   # Usage: ./agrisys-manager.sh [start|stop|restart|status]

   # Function to check if a service is running
   is_running() {
     systemctl is-active --quiet $1
     return $?
   }

   # Start services
   start_services() {
     echo "Starting Agricultural Management System..."

     # Check if MQTT broker is running
     if ! systemctl is-active --quiet mosquitto; then
       echo "Starting MQTT broker..."
       sudo systemctl start mosquitto
     else
       echo "MQTT broker already running."
     fi

     # Start the sensor simulator if not already running
     if ! is_running "agrisys-sensor-simulator"; then
       echo "Starting sensor simulator..."
       sudo systemctl start agrisys-sensor-simulator
     else
       echo "Sensor simulator already running."
     fi

     # Start the device controller if not already running
     if ! is_running "agrisys-device-controller"; then
       echo "Starting device controller..."
       sudo systemctl start agrisys-device-controller
     else
       echo "Device controller already running."
     fi

     echo "Agricultural Management System started."
   }

   # Stop services
   stop_services() {
     echo "Stopping Agricultural Management System..."

     # Stop sensor simulator
     if is_running "agrisys-sensor-simulator"; then
       echo "Stopping sensor simulator..."
       sudo systemctl stop agrisys-sensor-simulator
     fi

     # Stop device controller
     if is_running "agrisys-device-controller"; then
       echo "Stopping device controller..."
       sudo systemctl stop agrisys-device-controller
     fi

     echo "Agricultural Management System stopped."
   }

   # Check status of services
   check_status() {
     echo "Agricultural Management System Status:"

     # Check MQTT broker
     if systemctl is-active --quiet mosquitto; then
       echo "MQTT broker: RUNNING"
     else
       echo "MQTT broker: STOPPED"
     fi

     # Check sensor simulator
     if is_running "agrisys-sensor-simulator"; then
       echo "Sensor simulator: RUNNING"
     else
       echo "Sensor simulator: STOPPED"
     fi

     # Check device controller
     if is_running "agrisys-device-controller"; then
       echo "Device controller: RUNNING"
     else
       echo "Device controller: STOPPED"
     fi
   }

   # Process command line arguments
   case "$1" in
     start)
       start_services
       ;;
     stop)
       stop_services
       ;;
     restart)
       stop_services
       sleep 2
       start_services
       ;;
     status)
       check_status
       ;;
     *)
       echo "Usage: $0 {start|stop|restart|status}"
       exit 1
       ;;
   esac

   exit 0
   ```

6. **Make the Management Script Executable**:
   ```bash
   chmod +x agrisys-manager.sh
   ```

## Testing the Setup

1. **Start the Services**:
   ```bash
   ./agrisys-manager.sh start
   ```

2. **Check the Status**:
   ```bash
   ./agrisys-manager.sh status
   ```

3. **Test MQTT Connectivity**:
   ```bash
   node mqtt-test-client.js
   ```

4. **Monitor Logs**:
   ```bash
   tail -f logs/sensor.log
   tail -f logs/controller.log
   ```

## Troubleshooting

1. **Check Mosquitto Service Status**:
   ```bash
   sudo systemctl status mosquitto
   ```

2. **View Mosquitto Logs**:
   ```bash
   sudo tail -f /var/log/mosquitto/mosquitto.log
   ```

3. **Test MQTT Connection with Mosquitto Client**:
   ```bash
   mosquitto_sub -h localhost -t 'agrisys/#' -v
   ```

4. **Check Node.js Application Logs**:
   ```bash
   tail -f logs/sensor.log
   tail -f logs/controller.log
   ```

5. **Restart Services if Needed**:
   ```bash
   sudo systemctl restart mosquitto
   sudo systemctl restart agrisys-sensor-simulator
   sudo systemctl restart agrisys-device-controller
   ```

6. **Check for Network Issues**:
   ```bash
   ping -c 4 localhost
   sudo netstat -tulpn | grep -E '1883|9001'
   ```
