/**
 * MQTT Test Client for Agricultural Management System
 * 
 * This script simulates agricultural nodes sending data to the MQTT broker.
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
    // During day (6am-8pm), light values are higher
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 20;
    
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
