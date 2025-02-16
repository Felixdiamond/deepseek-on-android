#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

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
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
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
        warning "⚠️ Your device has less than 8GB RAM (${total_ram}MB)."
        warning "Recommended: 8GB+ RAM (12GB+ for 7B model)"
        warning "Performance may be slower and some models might not work properly."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    else
        log "✅ RAM check passed: ${total_ram}MB"
    fi
    
    # Check storage
    if ! command -v bc &> /dev/null; then
        pkg install -y bc --force-confdef --force-confold
    fi
    
    available_storage=$(df -h /data | awk 'NR==2 {print $4}' | sed 's/G//')
    if (( $(echo "$available_storage < 12" | bc -l) )); then
        warning "⚠️ Low storage space detected: ${available_storage}GB available"
        warning "Recommended: 12GB+ free storage"
        warning "You might not be able to download larger models."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    else
        log "✅ Storage check passed: ${available_storage}GB available"
    fi
    
    log "System requirements check completed"
}

# Setup storage access
setup_storage() {
    log "Setting up storage access..."
    
    # Try to setup storage access
    termux-setup-storage
    
    # Wait for user to grant permission
    for i in {1..5}; do
        if [ -d "$HOME/storage" ]; then
            log "✅ Storage access granted"
            return 0
        fi
        warning "Waiting for storage permission... ($i/5)"
        sleep 2
    done
    
    # If we get here, storage permission wasn't granted
    warning "⚠️ Storage permission not granted."
    warning "Some features might not work properly."
    read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        exit 1
    fi
}

# Update packages
update_packages() {
    log "Updating package repositories..."
    if ! pkg update -y; then
        warning "⚠️ Failed to update package repositories."
        warning "Some packages might be outdated."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    fi
    
    if ! pkg upgrade -y; then
        warning "⚠️ Failed to upgrade packages."
        warning "Some features might not work properly."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    fi
    
    log "Installing required packages..."
    required_packages="git cmake golang libjpeg-turbo python make wget clang"
    for package in $required_packages; do
        if ! pkg install -y "$package" --force-confdef --force-confold; then
            warning "⚠️ Failed to install $package"
            warning "Some features might not work properly."
            read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
            echo
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                exit 1
            fi
        fi
    done
}

# Install Ollama
install_ollama() {
    log "Installing Ollama..."
    
    if [ -d "ollama" ]; then
        warning "Ollama directory exists, removing..."
        rm -rf ollama
    fi
    
    if ! git clone --depth 1 https://github.com/ollama/ollama.git; then
        warning "⚠️ Failed to clone Ollama repository."
        warning "Please check your internet connection."
        read -p "Do you want to retry? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            install_ollama
            return
        fi
        exit 1
    fi
    
    cd ollama
    
    log "Building Ollama..."
    if ! go generate ./...; then
        warning "⚠️ Failed to generate Ollama files."
        cd ..
        read -p "Do you want to retry? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            install_ollama
            return
        fi
        exit 1
    fi
    
    if ! go build; then
        warning "⚠️ Failed to build Ollama."
        cd ..
        read -p "Do you want to retry? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            install_ollama
            return
        fi
        exit 1
    fi
    
    # Make ollama executable available system-wide
    if ! cp ollama $PREFIX/bin/; then
        warning "⚠️ Failed to install Ollama."
        warning "You might need to run it from the current directory."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    fi
    cd ..
}

# Setup model
setup_model() {
    log "Setting up DeepSeek model..."
    
    # Ask user which model to install
    echo "Available models:"
    echo "1) deepseek-r1:1.5b (5.7GB) - Best for devices with 8GB RAM"
    echo "2) deepseek-r1:7b (12GB) - Better quality, requires 12GB+ RAM"
    
    read -p "Choose a model (1-2): " model_choice < /dev/tty
    
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
    pkg install -y termux-services --force-confdef --force-confold
    
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

# Setup frontend
setup_frontend() {
    log "Setting up frontend..."
    
    # Create frontend directory
    mkdir -p deepseek-frontend
    cd deepseek-frontend
    
    # Download frontend files
    log "Downloading frontend files..."
    
    # Download frontend.py
    if ! wget -q https://raw.githubusercontent.com/Felixdiamond/deepseek-android/main/frontend.py; then
        warning "⚠️ Failed to download frontend.py"
        warning "Please check your internet connection."
        read -p "Do you want to retry? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            cd ..
            setup_frontend
            return
        fi
        cd ..
        exit 1
    fi
    
    # Create requirements.txt
    cat > requirements.txt << 'EOF'
streamlit==1.31.1
requests==2.31.0
python-dotenv==1.0.1
markdown==3.5.2
pygments==2.17.2
keyboard==0.13.5
EOF
    
    # Create start script
    cat > start.sh << 'EOF'
#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

# Check if Ollama is running
if ! pgrep ollama > /dev/null; then
    log "Starting Ollama server..."
    ollama serve &
    sleep 5
fi

# Install Python dependencies if not already installed
log "Checking Python dependencies..."
pip install -r requirements.txt

# Start the Streamlit frontend
log "Starting frontend application..."
streamlit run frontend.py --server.port 8501 --server.address 0.0.0.0
EOF
    
    chmod +x start.sh
    
    # Install Python dependencies
    log "Installing Python dependencies..."
    if ! pip install -r requirements.txt; then
        warning "⚠️ Failed to install some Python dependencies."
        warning "The frontend might not work properly."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            cd ..
            exit 1
        fi
    fi
    
    cd ..
    
    # Create convenience script in PATH
    cat > $PREFIX/bin/deepseek << 'EOF'
#!/bin/bash
cd $HOME/deepseek-frontend
./start.sh
EOF
    
    chmod +x $PREFIX/bin/deepseek
    
    log "✅ Frontend setup completed"
    log "To start DeepSeek, simply run: deepseek"
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
    setup_frontend
    
    log "Installation completed successfully! 🎉"
    log "To start DeepSeek, run: deepseek"
    log "To optimize performance before running, execute: optimize-deepseek"
}

# Run main installation
main 