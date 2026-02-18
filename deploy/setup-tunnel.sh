#!/bin/bash
# Setup Cloudflare Tunnel per accesso remoto a BancaAdvisor
# Prerequisiti: account Cloudflare gratuito su https://dash.cloudflare.com
#
# Come funziona:
# - Cloudflare crea un tunnel sicuro dal Pi ai loro server
# - Ti dà un URL tipo https://bancadvisor.tuodominio.com (o un .cfargotunnel.com gratis)
# - HTTPS automatico, niente port forwarding, niente IP pubblico
# - La PWA funziona su iPhone perché è HTTPS

set -e

echo "=== Setup Cloudflare Tunnel ==="

# Install cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo ">> Installazione cloudflared..."
    # Per Raspberry Pi ARM
    ARCH=$(dpkg --print-architecture)
    curl -L "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -o /tmp/cloudflared.deb
    sudo dpkg -i /tmp/cloudflared.deb
    rm /tmp/cloudflared.deb
fi

echo ""
echo "=== PASSO 1: Login Cloudflare ==="
echo "Si aprirà un link nel terminale. Copialo nel browser del PC e autorizza."
echo ""
cloudflared tunnel login

echo ""
echo "=== PASSO 2: Creazione tunnel ==="
read -p "Nome per il tunnel (es. bancadvisor): " TUNNEL_NAME
TUNNEL_NAME=${TUNNEL_NAME:-bancadvisor}

cloudflared tunnel create "$TUNNEL_NAME"

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep "$TUNNEL_NAME" | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"

# Config file
CRED_FILE="$HOME/.cloudflared/${TUNNEL_ID}.json"
mkdir -p "$HOME/.cloudflared"

cat > "$HOME/.cloudflared/config.yml" <<EOF
tunnel: ${TUNNEL_ID}
credentials-file: ${CRED_FILE}

ingress:
  - service: http://localhost:8080
EOF

echo ""
echo "=== PASSO 3: DNS ==="
echo ""
echo "Hai due opzioni:"
echo ""
echo "A) Se hai un dominio su Cloudflare:"
read -p "   Dominio (es. miosito.com, oppure premi Invio per saltare): " DOMAIN

if [ -n "$DOMAIN" ]; then
    read -p "   Sottodominio (es. mutui): " SUBDOMAIN
    SUBDOMAIN=${SUBDOMAIN:-bancadvisor}
    HOSTNAME="${SUBDOMAIN}.${DOMAIN}"
    cloudflared tunnel route dns "$TUNNEL_NAME" "$HOSTNAME"
    URL="https://${HOSTNAME}"
else
    echo ""
    echo "   Nessun dominio. Puoi usare il tunnel con:"
    echo "   cloudflared tunnel run $TUNNEL_NAME"
    echo "   e accedere via https://${TUNNEL_ID}.cfargotunnel.com"
    URL="https://${TUNNEL_ID}.cfargotunnel.com"
fi

# Systemd service for tunnel
echo ""
echo ">> Creazione servizio systemd per il tunnel..."
sudo tee /etc/systemd/system/cloudflared.service > /dev/null <<EOF
[Unit]
Description=Cloudflare Tunnel per BancaAdvisor
After=network.target bancadvisor.service

[Service]
Type=simple
User=$USER
ExecStart=$(which cloudflared) tunnel run ${TUNNEL_NAME}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

echo ""
echo "=== FATTO! ==="
echo ""
echo "BancaAdvisor è accessibile da ovunque:"
echo "  $URL"
echo ""
echo "Comandi utili:"
echo "  sudo systemctl status cloudflared    # stato tunnel"
echo "  sudo systemctl restart cloudflared   # riavvia tunnel"
echo "  sudo journalctl -u cloudflared -f    # log tunnel"
echo ""
echo "Su iPhone: apri $URL in Safari → Condividi → Aggiungi a Home"
echo "(La PWA funziona perché Cloudflare fornisce HTTPS!)"
echo ""
