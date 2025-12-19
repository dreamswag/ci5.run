#!/bin/sh
# ⛩️ Ci5 Bootstrap Protocol (v7.4-RC-1)
# The Gateway between the Spectral (Web) and Physical (Device)

REPO_URL="https://github.com/dreamswag/ci5.git"
INSTALL_DIR="/opt/ci5"
BRANCH="main"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

clear
echo -e "${GREEN}UPLINK ESTABLISHED.${NC}"
echo -e "Initializing Ci5 Genesis Protocol..."
echo ""

# 1. ROOT CHECK
if [ "$(id -u)" -ne 0 ]; then
    echo -e "${RED}ERR: IDENTITY_MISMATCH.${NC} Run as root (sudo)."
    exit 1
fi

# 2. DEPENDENCY INJECTION (Minimal)
echo -e "${YELLOW}[*] Securing supply lines...${NC}"
if command -v apt-get >/dev/null; then
    # Debian/PiOS
    apt-get update -qq >/dev/null 2>&1
    apt-get install -y -qq git curl whiptail tar >/dev/null 2>&1
elif command -v opkg >/dev/null; then
    # OpenWrt
    opkg update >/dev/null 2>&1
    opkg install git-http curl ca-certificates tar >/dev/null 2>&1
fi

# 3. REPO CLONING (The Physical Anchor)
if [ -d "$INSTALL_DIR/.git" ]; then
    echo -e "${YELLOW}[*] Existing construct detected. Updating...${NC}"
    cd "$INSTALL_DIR" && git pull origin "$BRANCH" >/dev/null 2>&1
else
    echo -e "${GREEN}[*] Cloning Core Repository...${NC}"
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR" >/dev/null 2>&1
fi

# 4. HANDOFF
cd "$INSTALL_DIR"
chmod +x *.sh configs/*.sh extras/*.sh

# Run The Wizard (Setup)
if [ ! -f "ci5.config" ]; then
    echo -e "${GREEN}[*] Launching Configuration Wizard...${NC}"
    ./setup.sh
else
    echo -e "${YELLOW}[*] Configuration found. Skipping Wizard.${NC}"
fi

# Run The Installer
echo -e "${GREEN}[*] Engaging Installation Engine...${NC}"
./install-full.sh