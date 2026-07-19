#!/usr/bin/env bash
# LovableOS one-shot installer for Ubuntu 22.04+ / Debian 12+.
#   curl -fsSL https://raw.githubusercontent.com/abhas-kumar-sinha/vm-cosy-desk/main/install.sh | sudo bash
set -euo pipefail

REPO_URL="${LOVABLE_OS_REPO:-https://github.com/abhas-kumar-sinha/vm-cosy-desk.git}"
INSTALL_DIR="${LOVABLE_OS_DIR:-/opt/lovable-os}"
PORT="${LOVABLE_OS_PORT:-8080}"

if [[ $EUID -ne 0 ]]; then
  echo "Please run as root (sudo bash install.sh)." >&2
  exit 1
fi

echo "==> Installing OS dependencies"
apt-get update
apt-get install -y git curl ca-certificates build-essential python3 libpam0g-dev

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -Eq '^v(20|22)'; then
  echo "==> Installing Node.js 20 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi

echo "==> Cloning $REPO_URL into $INSTALL_DIR"
if [[ -d "$INSTALL_DIR/.git" ]]; then
  git -C "$INSTALL_DIR" pull --ff-only
else
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

echo "==> Performing a clean frontend install and rebuild"
cd "$INSTALL_DIR"
rm -rf node_modules dist .output
npm i
npm run build

echo "==> Performing a clean agent install"
cd "$INSTALL_DIR/agent"
rm -rf node_modules
npm i

echo "==> Writing /etc/lovable-os/config.json"
mkdir -p /etc/lovable-os
if [[ ! -f /etc/lovable-os/config.json ]]; then
  cat > /etc/lovable-os/config.json <<EOF
{
  "port": $PORT,
  "host": "0.0.0.0",
  "uploadDir": "/var/lib/lovable-os/uploads"
}
EOF
fi
mkdir -p /var/lib/lovable-os/uploads

echo "==> Installing systemd unit"
cp "$INSTALL_DIR/agent/systemd/lovable-os.service" /etc/systemd/system/lovable-os.service
systemctl stop lovable-os 2>/dev/null || true
systemctl daemon-reload
systemctl enable --now lovable-os
systemctl restart lovable-os
systemctl restart lovable-os
systemctl restart lovable-os

IP="$(hostname -I | awk '{print $1}')"
echo
echo "======================================================================"
echo "  LovableOS is running."
echo "  Open  ->  http://${IP}:${PORT}"
echo "  Log in with your Linux user + password (PAM)."
echo "  Manage:  systemctl status lovable-os"
echo "  Logs:    journalctl -fu lovable-os"
echo "======================================================================"
