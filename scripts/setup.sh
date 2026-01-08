#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Postly Production Setup ===${NC}"

# 1. Check Dependencies
echo -e "\n${YELLOW}[1/3] Checking dependencies...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker is not installed.${NC}"
    exit 1
fi
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}Dependencies OK.${NC}"

# 2. Environment Setup
echo -e "\n${YELLOW}[2/3] Setting up environment...${NC}"

if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
else
    echo ".env already exists."
fi

# Function to generate secret if missing or default
generate_secret() {
    local key=$1
    local length=$2
    if grep -q "^${key}=.*required" .env || grep -q "^${key}=$" .env || ! grep -q "^${key}=" .env; then
        echo "Generating secure ${key}..."
        local secret=$(openssl rand -hex $length)
        # Use sed based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${secret}|" .env
        else
            sed -i "s|^${key}=.*|${key}=${secret}|" .env
        fi
    fi
}

# Generate secrets
generate_secret "JWT_SECRET" 32
generate_secret "JWT_REFRESH_SECRET" 32
generate_secret "DB_PASSWORD" 16

# Check for mandatory external keys
check_key() {
    local key=$1
    local val=$(grep "^${key}=" .env | cut -d '=' -f2-)
    if [[ -z "$val" || "$val" == *"required"* || "$val" == *"<"* ]]; then
        echo -e "${RED}Missing required key: ${key}${NC}"
        read -p "Enter value for ${key}: " user_val
        if [[ -n "$user_val" ]]; then
             if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|^${key}=.*|${key}=${user_val}|" .env
            else
                sed -i "s|^${key}=.*|${key}=${user_val}|" .env
            fi
        else
            echo -e "${YELLOW}Warning: ${key} is empty. Service may fail.${NC}"
        fi
    fi
}

check_key "GEMINI_API_KEY"
check_key "DISCORD_TOKEN"
check_key "DISCORD_CLIENT_ID"

echo -e "${GREEN}Environment setup complete.${NC}"

# 3. Final steps
echo -e "\n${YELLOW}[3/3] Ready to launch!${NC}"
echo -e "Run ${GREEN}make up${NC} to start the services."
