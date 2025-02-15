#!/bin/bash

# DeepSeek Android Installation Script
# This script automates the installation of DeepSeek on Android using Termux

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Check if running in Termux
if [ ! -d "/data/data/com.termux" ]; then
    error "This script must be run in Termux on Android"
    exit 1
fi

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check processor
    processor=$(getprop ro.product.board)
    if [[ ! "$processor" =~ "SM8550" && ! "$processor" =~ "SM8650" ]]; then
        warning "⚠️ Your processor may not meet the recommended requirements."
        warning "Recommended: Snapdragon 8 Gen 2/3 or equivalent"
        warning "Your processor: $processor"
        warning "Performance may be significantly slower on your device."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    else
        log "✅ Processor check passed: $processor"
    fi
    
    # Check RAM
    total_ram=$(free -m | awk '/^Mem:/{print $2}')
    if [ "$total_ram" -lt 8000 ]; then
        error "Your device has less than 8GB RAM (${total_ram}MB). This may cause performance issues."
        read -p "Do you want to continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log "✅ RAM check passed: ${total_ram}MB"
    fi
    
    # Check storage
    available_storage=$(df -h /data | awk 'NR==2 {print $4}' | sed 's/G//')
    if (( $(echo "$available_storage < 12" | bc -l) )); then
        error "You need at least 12GB of free storage. Available: ${available_storage}GB"
        exit 1
    else
        log "✅ Storage check passed: ${available_storage}GB available"
    fi
    
    log "System requirements check completed"
}

# Setup storage access
setup_storage() {
    log "Setting up storage access..."
    termux-setup-storage
    sleep 2
}

# Update packages
update_packages() {
    log "Updating package repositories..."
    pkg update -y && pkg upgrade -y
    
    log "Installing required packages..."
    pkg install -y git cmake golang libjpeg-turbo python make wget clang
    
    if [ $? -ne 0 ]; then
        error "Failed to install required packages"
        exit 1
    fi
}

# Install Ollama
install_ollama() {
    log "Installing Ollama..."
    
    if [ -d "ollama" ]; then
        warning "Ollama directory exists, removing..."
        rm -rf ollama
    fi
    
    git clone --depth 1 https://github.com/ollama/ollama.git
    cd ollama
    
    log "Building Ollama..."
    go generate ./...
    go build
    
    if [ $? -ne 0 ]; then
        error "Failed to build Ollama"
        exit 1
    fi
    
    # Make ollama executable available system-wide
    cp ollama $PREFIX/bin/
    cd ..
}

# Setup model
setup_model() {
    log "Setting up DeepSeek model..."
    
    # Ask user which model to install
    echo "Available models:"
    echo "1) deepseek-r1:1.5b (5.7GB) - Best for devices with 8GB RAM"
    echo "2) deepseek-r1:7b (12GB) - Better quality, requires 12GB+ RAM"
    
    read -p "Choose a model (1-2): " model_choice
    
    case $model_choice in
        1) MODEL="deepseek-r1:1.5b" ;;
        2) MODEL="deepseek-r1:7b" ;;
        *) 
            error "Invalid choice. Defaulting to deepseek-r1:1.5b"
            MODEL="deepseek-r1:1.5b"
        ;;
    esac
    
    log "Downloading $MODEL..."
    ollama pull $MODEL
    
    if [ $? -ne 0 ]; then
        error "Failed to download model"
        exit 1
    fi
}

# Setup performance optimizations
setup_performance() {
    log "Setting up performance optimizations..."
    
    # Install Termux services for wake lock
    pkg install -y termux-services
    
    # Enable wake lock to prevent sleep
    sv-enable termux-wake-lock
    
    # Create performance script
    cat > $PREFIX/bin/optimize-deepseek << 'EOF'
#!/bin/bash
sync && echo 3 > /proc/sys/vm/drop_caches
echo "performance" > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
EOF
    
    chmod +x $PREFIX/bin/optimize-deepseek
}

# Main installation process
main() {
    log "Starting DeepSeek Android installation..."
    
    check_requirements
    setup_storage
    update_packages
    install_ollama
    setup_model
    setup_performance
    
    log "Installation completed successfully!"
    log "To start DeepSeek, run: ollama run $MODEL"
    log "To optimize performance before running, execute: optimize-deepseek"
}

# Run main installation
main 