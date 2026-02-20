#!/bin/bash
# Setup BancaAdvisor on Raspberry Pi (anche Pi 2 con 1GB)
# Run: bash setup-pi.sh

set -e

echo "=== BancaAdvisor - Setup Raspberry Pi ==="

# Install dependencies
echo ">> Installazione dipendenze..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv git

# Node.js via NodeSource (versione leggera per Pi)
if ! command -v node &> /dev/null; then
    echo ">> Installazione Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Clone repo (or pull if exists)
APP_DIR="$HOME/BancaAdvisor"
if [ -d "$APP_DIR" ]; then
    echo ">> Aggiornamento repo..."
    cd "$APP_DIR"
    git pull
else
    echo ">> Clonazione repo..."
    git clone https://github.com/YOUR_USERNAME/BancaAdvisor.git "$APP_DIR"
    cd "$APP_DIR"
fi

# Backend setup
echo ">> Setup backend..."
cd "$APP_DIR/backend"
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Frontend build (può impiegare qualche minuto sul Pi 2)
echo ">> Build frontend (pazienza, il Pi ci mette un po')..."
cd "$APP_DIR/frontend"
export NODE_OPTIONS="--max-old-space-size=512"
npm ci
npm run build

# Create systemd service
echo ">> Creazione servizio BancaAdvisor..."
sudo tee /etc/systemd/system/bancadvisor.service > /dev/null <<EOF
[Unit]
Description=BancaAdvisor - Consulente Mutui
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR/backend
Environment=PATH=$APP_DIR/backend/venv/bin:/usr/bin:/bin
Environment=FRONTEND_DIST=$APP_DIR/frontend/dist
ExecStart=$APP_DIR/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable bancadvisor
sudo systemctl restart bancadvisor

IP=$(hostname -I | awk '{print $1}')

echo ""
echo "=== BancaAdvisor attivo! ==="
echo "  Rete locale: http://$IP:8080"
echo ""
echo "=== Per accesso REMOTO (Cloudflare Tunnel): ==="
echo "  bash ~/BancaAdvisor/deploy/setup-tunnel.sh"
echo ""
echo "Comandi utili:"
echo "  sudo systemctl status bancadvisor    # stato"
echo "  sudo systemctl restart bancadvisor   # riavvia"
echo "  sudo journalctl -u bancadvisor -f    # log"
echo ""
