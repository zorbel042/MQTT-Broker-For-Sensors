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
