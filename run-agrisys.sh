#!/bin/bash

# Script to manage Agricultural System MQTT services
# Usage: ./run-agrisys.sh [start|stop|restart|status]

# Function to check if a process is running
is_running() {
  pgrep -f "$1" > /dev/null
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
  if ! is_running "mqtt-sensor-simulator.js"; then
    echo "Starting sensor simulator..."
    node mqtt-sensor-simulator.js > logs/sensor.log 2>&1 &
    echo "Sensor simulator started with PID $!"
  else
    echo "Sensor simulator already running."
  fi
  
  # Start the device controller if not already running
  if ! is_running "mqtt-device-controller.js"; then
    echo "Starting device controller..."
    node mqtt-device-controller.js > logs/controller.log 2>&1 &
    echo "Device controller started with PID $!"
  else
    echo "Device controller already running."
  fi
  
  echo "Agricultural Management System started."
}

# Stop services
stop_services() {
  echo "Stopping Agricultural Management System..."
  
  # Stop sensor simulator
  if is_running "mqtt-sensor-simulator.js"; then
    echo "Stopping sensor simulator..."
    pkill -f "mqtt-sensor-simulator.js"
  fi
  
  # Stop device controller
  if is_running "mqtt-device-controller.js"; then
    echo "Stopping device controller..."
    pkill -f "mqtt-device-controller.js"
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
  if is_running "mqtt-sensor-simulator.js"; then
    echo "Sensor simulator: RUNNING"
  else
    echo "Sensor simulator: STOPPED"
  fi
  
  # Check device controller
  if is_running "mqtt-device-controller.js"; then
    echo "Device controller: RUNNING"
  else
    echo "Device controller: STOPPED"
  fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

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
