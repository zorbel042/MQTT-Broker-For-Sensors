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

# Create project directory
echo "Setting up project directory..."
mkdir -p ~/agrisys
cd ~/agrisys

# Initialize Node.js project
echo "Initializing Node.js project..."
npm init -y

# Install required packages
echo "Installing required Node.js packages..."
npm install mqtt

# Create data directory
mkdir -p src/data
mkdir -p logs

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

# Setup SSH for secure access
echo "Setting up SSH for secure access..."
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_rsa ]; then
  echo "Generating SSH key..."
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
  echo "Your public SSH key is:"
  cat ~/.ssh/id_rsa.pub
  echo "Add this key to your authorized_keys file on any systems you want to connect to."
fi

echo "Initialization complete!"
echo "You can now start the services with:"
echo "./agrisys-manager.sh start"
echo ""
echo "Make sure to copy your Node.js scripts and data files to the ~/agrisys directory."
