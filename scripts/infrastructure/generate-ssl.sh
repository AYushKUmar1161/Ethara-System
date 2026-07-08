#!/bin/bash
# ============================================================
# generate-ssl.sh
# Generates a self-signed SSL certificate for local/staging use
# For production, use Let's Encrypt (certbot) instead
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="$SCRIPT_DIR/ssl"

mkdir -p "$SSL_DIR"

echo "Generating self-signed SSL certificate in $SSL_DIR..."

openssl req -x509 \
    -nodes \
    -days 365 \
    -newkey rsa:2048 \
    -keyout "$SSL_DIR/key.pem" \
    -out "$SSL_DIR/cert.pem" \
    -subj "/C=US/ST=State/L=City/O=Ethara/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo ""
echo "Self-signed certificate generated successfully!"
echo "  Certificate: $SSL_DIR/cert.pem"
echo "  Private Key: $SSL_DIR/key.pem"
echo ""
echo "For production, replace with Let's Encrypt certificates:"
echo "  sudo certbot certonly --standalone -d your-domain.com"
echo "  Then copy: /etc/letsencrypt/live/your-domain.com/fullchain.pem -> cert.pem"
echo "             /etc/letsencrypt/live/your-domain.com/privkey.pem   -> key.pem"
