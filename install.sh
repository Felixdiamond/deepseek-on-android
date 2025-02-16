#!/bin/bash
export DEBIAN_FRONTEND=noninteractive

# Create checkpoint directory for debugging/resume support
CHECKPOINT_DIR="$HOME/.deepseek_installer_checkpoints"
mkdir -p "$CHECKPOINT_DIR"

# DeepSeek Android Installation Script for Termux
# This script automates the installation of DeepSeek on Android

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log functions
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

# Check system requirements (always run these)
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
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    else
        log "✅ RAM check passed: ${total_ram}MB"
    fi
    
    # Check storage and bc (for calculations)
    if ! command -v bc &> /dev/null; then
        pkg install -y bc
    fi
    
    available_storage=$(df -h /data | awk 'NR==2 {print $4}' | sed 's/G//')
    if (( $(echo "$available_storage < 12" | bc -l) )); then
        warning "⚠️ Low storage space detected: ${available_storage}GB available"
        warning "Recommended: 12GB+ free storage"
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

# Setup storage access (always run)
setup_storage() {
    log "Setting up storage access..."
    
    termux-setup-storage
    
    for i in {1..5}; do
        if [ -d "$HOME/storage" ]; then
            log "✅ Storage access granted"
            return 0
        fi
        warning "Waiting for storage permission... ($i/5)"
        sleep 2
    done
    
    warning "⚠️ Storage permission not granted. Some features may not work properly."
    read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        exit 1
    fi
}

# Update packages (with checkpoint)
update_packages() {
    if [ -f "$CHECKPOINT_DIR/update_packages" ]; then
        log "Skipping package update (checkpoint exists)."
        return
    fi

    log "Updating package repositories..."
    apt-get update -y < /dev/null
    if ! apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" < /dev/null; then
        warning "⚠️ Failed to upgrade packages. Some features might not work properly."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    fi
    
    log "Installing required packages..."
    required_packages="git cmake golang libjpeg-turbo python make wget clang termux-services"
    for package in $required_packages; do
        if ! pkg install -y "$package"; then
            warning "⚠️ Failed to install $package."
            read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
            echo
            if [[ $REPLY =~ ^[Nn]$ ]]; then
                exit 1
            fi
        fi
    done
    touch "$CHECKPOINT_DIR/update_packages"
}

# Install Ollama (with checkpoint)
install_ollama() {
    if [ -f "$CHECKPOINT_DIR/install_ollama" ]; then
        log "Skipping Ollama installation (checkpoint exists)."
        return
    fi

    log "Installing Ollama..."
    
    if [ -d "ollama" ]; then
        warning "Ollama directory exists, removing..."
        rm -rf ollama
    fi
    
    if ! git clone --depth 1 https://github.com/ollama/ollama.git; then
        warning "⚠️ Failed to clone Ollama repository. Please check your internet connection."
        read -p "Do you want to retry? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            install_ollama
            return
        fi
        exit 1
    fi
    
    cd ollama || exit 1
    
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
    
    if ! cp ollama "$PREFIX/bin/"; then
        warning "⚠️ Failed to install Ollama. You might need to run it from the current directory."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            exit 1
        fi
    fi
    cd ..
    touch "$CHECKPOINT_DIR/install_ollama"
}

# Start Ollama service helper function
start_ollama_service() {
    if ! pgrep ollama > /dev/null; then
        log "Starting Ollama service..."
        ollama serve &
        sleep 5
        if ! pgrep ollama > /dev/null; then
            error "Could not start Ollama service. Please ensure it is installed correctly."
            exit 1
        fi
    else
        log "Ollama service is already running."
    fi
}

# Setup model (with checkpoint)
setup_model() {
    if [ -f "$CHECKPOINT_DIR/setup_model" ]; then
        log "Skipping model setup (checkpoint exists)."
        return
    fi

    # Ensure Ollama service is running before pulling model
    start_ollama_service

    log "Setting up DeepSeek model..."
    
    echo "Available models:"
    echo "1) deepseek-r1:1.5b (1.1GB) - Best for devices with 8GB RAM"
    echo "2) deepseek-r1:7b (4.7GB) - Better quality, requires 12GB+ RAM"
    
    read -p "Choose a model (1-2): " model_choice < /dev/tty
    # Trim whitespace from input
    model_choice=$(echo "$model_choice" | tr -d '[:space:]')
    
    case "$model_choice" in
        1) MODEL="deepseek-r1:1.5b" ;;
        2) MODEL="deepseek-r1:7b" ;;
        *) 
            error "Invalid choice. Defaulting to deepseek-r1:1.5b"
            MODEL="deepseek-r1:1.5b"
        ;;
    esac
    
    log "Downloading $MODEL..."
    if ! ollama pull "$MODEL"; then
        error "Failed to download model"
        exit 1
    fi
    touch "$CHECKPOINT_DIR/setup_model"
}

# Setup performance optimizations (with checkpoint)
setup_performance() {
    if [ -f "$CHECKPOINT_DIR/setup_performance" ]; then
        log "Skipping performance setup (checkpoint exists)."
        return
    fi

    log "Setting up performance optimizations..."
    
    # Termux services (wake lock) are already installed in update_packages.
    sv-enable termux-wake-lock
    
    # Create performance optimization script
    cat > "$PREFIX/bin/optimize-deepseek" << 'EOF'
#!/bin/bash
sync && echo 3 > /proc/sys/vm/drop_caches
echo "performance" > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
EOF
    chmod +x "$PREFIX/bin/optimize-deepseek"
    touch "$CHECKPOINT_DIR/setup_performance"
}

# Setup frontend (with checkpoint)
setup_frontend() {
    if [ -f "$CHECKPOINT_DIR/setup_frontend" ]; then
        log "Skipping frontend setup (checkpoint exists)."
        return
    fi

    log "Setting up frontend..."
    
    mkdir -p deepseek-frontend
    cd deepseek-frontend || exit 1
    
    log "Downloading frontend files..."
    if ! wget -q https://raw.githubusercontent.com/Felixdiamond/deepseek-android/main/frontend.py; then
        warning "⚠️ Failed to download frontend.py. Please check your internet connection."
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
    
    cat > requirements.txt << 'EOF'
streamlit==1.31.1
requests==2.31.0
python-dotenv==1.0.1
markdown==3.5.2
pygments==2.17.2
keyboard==0.13.5
EOF
    
    cat > start.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

if ! pgrep ollama > /dev/null; then
    log "Starting Ollama service..."
    ollama serve &
    sleep 5
fi

log "Checking Python dependencies..."
pip install -r requirements.txt

log "Starting frontend application..."
streamlit run frontend.py --server.port 8501 --server.address 0.0.0.0
EOF
    chmod +x start.sh
    
    log "Installing Python dependencies..."
    if ! pip install -r requirements.txt; then
        warning "⚠️ Failed to install some Python dependencies. The frontend might not work properly."
        read -p "Do you want to continue anyway? (Y/n) " -n 1 -r < /dev/tty
        echo
        if [[ $REPLY =~ ^[Nn]$ ]]; then
            cd ..
            exit 1
        fi
    fi
    cd ..
    
    cat > "$PREFIX/bin/deepseek" << 'EOF'
#!/bin/bash
cd $HOME/deepseek-frontend
./start.sh
EOF
    chmod +x "$PREFIX/bin/deepseek"
    
    log "✅ Frontend setup completed. To start DeepSeek, simply run: deepseek"
    touch "$CHECKPOINT_DIR/setup_frontend"
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

main 