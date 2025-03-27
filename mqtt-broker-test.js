/**
 * MQTT Broker Test Script
 * 
 * This script tests the MQTT broker by publishing and subscribing to test topics.
 * It verifies that the broker is working correctly before connecting it to the application.
 */

const mqtt = require('mqtt');

// Configuration
const MQTT_BROKER = 'mqtt://localhost:1883';
const TEST_TOPIC = 'agrisys/test';
const NODE_TOPIC = 'agrisys/nodes/test-node-1/sensors';

// Connect to MQTT broker
console.log(`Connecting to MQTT broker at ${MQTT_BROKER}...`);
const client = mqtt.connect(MQTT_BROKER);

// Handle connection events
client.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to test topics
  client.subscribe([TEST_TOPIC, NODE_TOPIC], (err) => {
    if (err) {
      console.error('Error subscribing to topics:', err);
    } else {
      console.log(`Subscribed to topics: ${TEST_TOPIC}, ${NODE_TOPIC}`);
      
      // Publish a test message
      client.publish(TEST_TOPIC, JSON.stringify({ message: 'Hello MQTT Broker!' }));
      console.log(`Published test message to ${TEST_TOPIC}`);
      
      // Publish simulated sensor data
      const sensorData = {
        soilMoisture: {
          value: 65.5,
          unit: '%',
          status: 'optimal'
        },
        light: {
          value: 850,
          unit: 'lux',
          status: 'optimal'
        },
        humidity: {
          value: 62.3,
          unit: '%',
          status: 'optimal'
        },
        temperature: {
          value: 22.4,
          unit: '°C',
          status: 'optimal'
        }
      };
      
      client.publish(NODE_TOPIC, JSON.stringify(sensorData));
      console.log(`Published simulated sensor data to ${NODE_TOPIC}`);
    }
  });
});

// Handle message events
client.on('message', (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`Received message on ${topic}:`, payload);
  } catch (error) {
    console.error('Error parsing message:', error);
    console.log(`Received raw message on ${topic}:`, message.toString());
  }
});

// Handle error events
client.on('error', (error) => {
  console.error('MQTT connection error:', error);
});

// Handle close events
client.on('close', () => {
  console.log('Connection to MQTT broker closed');
});

// Handle reconnect events
client.on('reconnect', () => {
  console.log('Attempting to reconnect to MQTT broker...');
});

// Handle timeout
setTimeout(() => {
  console.log('Test completed. Disconnecting from MQTT broker...');
  client.end();
  process.exit(0);
}, 5000);
