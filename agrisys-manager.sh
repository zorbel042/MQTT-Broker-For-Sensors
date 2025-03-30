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

  # Show log file locations
  echo ""
  echo "Log file locations:"
  echo "MQTT broker: /var/log/mosquitto/mosquitto.log"
  echo "Sensor simulator: ~/agrisys/logs/sensor.log"
  echo "Device controller: ~/agrisys/logs/controller.log"
}

# View logs
view_logs() {
  case "$1" in
    mqtt)
      sudo tail -f /var/log/mosquitto/mosquitto.log
      ;;
    sensor)
      tail -f ~/agrisys/logs/sensor.log
      ;;
    controller)
      tail -f ~/agrisys/logs/controller.log
      ;;
    all)
      echo "Press Ctrl+C to exit log view"
      echo "=== MQTT Broker Logs ==="
      sudo tail -n 20 /var/log/mosquitto/mosquitto.log
      echo ""
      echo "=== Sensor Simulator Logs ==="
      tail -n 20 ~/agrisys/logs/sensor.log
      echo ""
      echo "=== Device Controller Logs ==="
      tail -n 20 ~/agrisys/logs/controller.log
      ;;
    *)
      echo "Usage: $0 logs [mqtt|sensor|controller|all]"
      exit 1
      ;;
  esac
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
  logs)
    view_logs "$2"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|logs [mqtt|sensor|controller|all]}"
    exit 1
    ;;
esac

exit 0
