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

# Check if running in Debian proot
if ! grep -q "Debian" /etc/os-release; then
    error "This script must be run in a Debian proot environment"
    exit 1
fi

# Check system requirements (always run these)
check_requirements() {
    log "Checking system requirements..."
    processor=$(getprop ro.product.board 2>/dev/null || echo "unknown")
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

    if ! command -v bc &> /dev/null; then
        apt-get install -y bc
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
    required_packages="git cmake python3 python3-venv python3-pip make wget build-essential golang"
    for package in $required_packages; do
        if ! apt-get install -y "$package"; then
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
    start_ollama_service
    log "Setting up DeepSeek model..."
    echo "Available models:"
    echo "1) deepseek-r1:1.5b (1.1GB) - Best for devices with 8GB RAM"
    echo "2) deepseek-r1:7b (4.7GB) - Better quality, requires 12GB+ RAM"
    read -p "Choose a model (1-2): " model_choice < /dev/tty
    model_choice=$(echo "$model_choice" | tr -d '[:space:]')
    case "$model_choice" in
        1) MODEL="deepseek-r1:1.5b" ;;
        2) MODEL="deepseek-r1:7b" ;;
        *) 
            error "Invalid choice. Defaulting to deepseek-r1:1.5b"
            MODEL="deepseek-r1:1.5b" ;;
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
    sv-enable termux-wake-lock
    cat > "$PREFIX/bin/optimize-deepseek" << 'EOF'
#!/bin/bash
sync && echo 3 > /proc/sys/vm/drop_caches
echo "performance" > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
EOF
    chmod +x "$PREFIX/bin/optimize-deepseek"
    touch "$CHECKPOINT_DIR/setup_performance"
}

# Add Python version check and requirement
check_python_version() {
    log "Checking Python version..."
    # Get Python version if available
    if command -v python3 &> /dev/null; then
        python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
        if (( $(echo "$python_version >= 3.11" | bc -l) )); then
            log "✅ Python $python_version found"
            return 0
        fi
    fi
    
    log "Installing Python 3.11 or newer..."
    apt-get install -y python3
    
    # Verify installation
    if ! command -v python3 &> /dev/null; then
        error "Failed to install Python"
        exit 1
    fi
    
    python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if (( $(echo "$python_version >= 3.11" | bc -l) )); then
        log "✅ Python $python_version installed"
    else
        error "Installed Python version $python_version is too old. Version 3.11 or newer is required."
        exit 1
    fi
}

# Setup data directory
setup_data_directory() {
    if [ -f "$CHECKPOINT_DIR/setup_data_directory" ]; then
        log "Skipping data directory setup (checkpoint exists)."
        return
    fi

    log "Setting up data directory..."
    
    # Create data directory
    mkdir -p "$HOME/.local/share/open-webui"
    
    # Create backup directory
    mkdir -p "$HOME/.local/share/open-webui/backups"
    
    touch "$CHECKPOINT_DIR/setup_data_directory"
    log "✅ Data directory setup completed"
}

# Create admin account setup script
create_admin_setup() {
    log "Creating admin account setup script..."
    
    cat > "$PREFIX/bin/deepseek-admin" << 'EOF'
#!/bin/bash

# Function to generate a secure random password
generate_password() {
    tr -dc 'A-Za-z0-9!@#$%^&*' < /dev/urandom | head -c 16
}

# Create admin credentials file
ADMIN_FILE="$HOME/.local/share/open-webui/admin.json"

if [ ! -f "$ADMIN_FILE" ]; then
    echo "Setting up admin account..."
    read -p "Enter admin username [admin]: " username
    username=${username:-admin}
    
    read -p "Generate random password? [Y/n]: " generate
    if [[ $generate =~ ^[Nn]$ ]]; then
        read -s -p "Enter admin password: " password
        echo
        read -s -p "Confirm admin password: " password2
        echo
        if [ "$password" != "$password2" ]; then
            echo "Passwords do not match!"
            exit 1
        fi
    else
        password=$(generate_password)
        echo "Generated password: $password"
        echo "Please save this password!"
    fi
    
    # Save credentials
    echo "{\"username\":\"$username\",\"password\":\"$password\"}" > "$ADMIN_FILE"
    chmod 600 "$ADMIN_FILE"
    echo "Admin account created successfully!"
else
    echo "Admin account already exists."
    echo "To reset admin account, delete $ADMIN_FILE and run this script again."
fi
EOF

    chmod +x "$PREFIX/bin/deepseek-admin"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    cat > "$PREFIX/bin/deepseek-backup" << 'EOF'
#!/bin/bash

BACKUP_DIR="$HOME/.local/share/open-webui/backups"
DATA_DIR="$HOME/.local/share/open-webui"
DATE=$(date +%Y%m%d_%H%M%S)

case "$1" in
    create)
        echo "Creating backup..."
        tar -czf "$BACKUP_DIR/open-webui_$DATE.tar.gz" -C "$DATA_DIR" .
        echo "Backup created: open-webui_$DATE.tar.gz"
        ;;
    restore)
        if [ -z "$2" ]; then
            echo "Available backups:"
            ls -1 "$BACKUP_DIR"
            echo "Usage: $0 restore <backup_file>"
            exit 1
        fi
        if [ ! -f "$BACKUP_DIR/$2" ]; then
            echo "Backup file not found: $2"
            exit 1
        fi
        echo "Restoring from backup: $2"
        tar -xzf "$BACKUP_DIR/$2" -C "$DATA_DIR"
        echo "Backup restored successfully!"
        ;;
    list)
        echo "Available backups:"
        ls -1 "$BACKUP_DIR"
        ;;
    *)
        echo "Usage: $0 {create|restore|list}"
        echo "  create  - Create a new backup"
        echo "  restore - Restore from a backup"
        echo "  list    - List available backups"
        exit 1
        ;;
esac
EOF

    chmod +x "$PREFIX/bin/deepseek-backup"
}

# Create update script
create_update_script() {
    log "Creating update script..."
    
    cat > "$PREFIX/bin/deepseek-update" << 'EOF'
#!/bin/bash

# Activate virtual environment
source "$HOME/venv/bin/activate"

echo "Stopping services..."
deepseek-stop

echo "Creating backup..."
deepseek-backup create

echo "Updating Open WebUI..."
pip install -U open-webui

echo "Update completed!"
echo "You can start the services again by running: deepseek"
EOF

    chmod +x "$PREFIX/bin/deepseek-update"
}

# Install Open WebUI
install_open_webui() {
    if [ -f "$CHECKPOINT_DIR/install_open_webui" ]; then
        log "Skipping Open WebUI installation (checkpoint exists)."
        return
    fi

    log "Installing Open WebUI..."
    
    # Create and activate virtual environment
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate

    # Set environment variables for offline mode
    export HF_HUB_OFFLINE=1
    export OLLAMA_BASE_URL=http://localhost:11434

    # Install Open WebUI
    if ! pip install open-webui; then
        error "Failed to install Open WebUI"
        exit 1
    fi

    # Create service management scripts
    create_service_scripts
    create_admin_setup
    create_backup_script
    create_update_script

    log "✅ Open WebUI installed successfully"
    touch "$CHECKPOINT_DIR/install_open_webui"
}

# Create service management scripts
create_service_scripts() {
    log "Creating service management scripts..."

    # Create start script
    cat > "$PREFIX/bin/deepseek" << 'EOF'
#!/bin/bash

# Start Ollama if not running
if ! pgrep ollama > /dev/null; then
    echo "Starting Ollama service..."
    ollama serve &
    sleep 5
fi

# Activate virtual environment and start Open WebUI
source $HOME/venv/bin/activate
export HF_HUB_OFFLINE=1
export OLLAMA_BASE_URL=http://localhost:11434
open-webui serve
EOF

    # Create stop script
    cat > "$PREFIX/bin/deepseek-stop" << 'EOF'
#!/bin/bash

# Stop Open WebUI
pkill -f "open-webui"

# Stop Ollama
pkill -f "ollama"

echo "Services stopped"
EOF

    # Make scripts executable
    chmod +x "$PREFIX/bin/deepseek"
    chmod +x "$PREFIX/bin/deepseek-stop"

    log "✅ Service scripts created"
}

# Main installation process
main() {
    log "Starting DeepSeek Android installation..."
    check_requirements
    update_packages
    check_python_version
    setup_data_directory
    install_ollama
    setup_model
    setup_performance
    install_open_webui
    
    # Run first-time admin setup
    log "Running first-time admin setup..."
    deepseek-admin
    
    log "Installation completed successfully! 🎉"
    log "To start DeepSeek, run: deepseek"
    log "To stop services, run: deepseek-stop"
    log "To optimize performance before running, execute: optimize-deepseek"
    log "To update Open WebUI, run: deepseek-update"
    log "To manage backups, run: deepseek-backup"
    log "Access the web interface at: http://localhost:8080"
    
    # Print admin credentials if they exist
    ADMIN_FILE="$HOME/.local/share/open-webui/admin.json"
    if [ -f "$ADMIN_FILE" ]; then
        echo
        log "Admin credentials are stored in: $ADMIN_FILE"
        log "Please save your admin password in a secure location!"
    fi
}

main 