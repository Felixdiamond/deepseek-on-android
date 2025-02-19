# DeepSeek on Android 🚀

Run DeepSeek AI models locally on your Android device with automated installation and Open WebUI integration.

## Overview

This project provides tools and scripts to run DeepSeek models locally on Android devices using Open WebUI and Ollama, offering complete privacy, offline access, and a rich set of features.

## Features

### Core Features
- 🔒 **Complete Privacy**: All processing happens locally on your device
- 🌐 **Offline Access**: No internet connection required after initial setup
- ⚡ **Automated Setup**: Simple installation process with scripts
- 🎨 **Rich User Interface**: Feature-complete Open WebUI integration

### Advanced Features
- 📝 **Full Markdown & LaTeX Support**: Rich text formatting and mathematical equations
- 🔍 **Local RAG Integration**: Load and interact with documents directly in chat
- 🌐 **Web Browsing**: Seamlessly integrate web content into conversations
- 🎨 **Image Generation**: Support for various image generation models
- 🎤 **Voice/Video Support**: Hands-free voice and video call features
- 🔄 **Multi-Model Chat**: Use different models in parallel conversations
- 🛠️ **Model Builder**: Create and customize models via the Web UI
- 🐍 **Python Function Support**: Built-in code editor and function integration

## System Requirements

### Hardware
- **Processor:** Snapdragon 8 Gen 2/3 (or equivalent) — required for optimal performance
- **RAM:** Minimum **8GB** (12GB+ recommended for the 7B model)
- **Storage:** At least **12GB** of free storage

### Software
- Android 10 or higher
- [Termux](https://github.com/termux/termux-app/releases) (Latest version)
- Python 3.11 or newer (Automatically installed)

## Getting Started

### Installation Steps

1. **Install Termux:**  
   Download and install Termux from [F-Droid](https://f-droid.org/packages/com.termux/) or [GitHub](https://github.com/termux/termux-app/releases)

2. **Install proot-distro:**
   ```bash
   pkg update -y && pkg install -y proot-distro
   proot-distro install debian
   ```

3. **Enter Debian Environment:**
   ```bash
   proot-distro login debian
   ```

4. **Run the Installation Script:**
   ```bash
   apt-get update && apt-get install -y curl
   curl -sSL https://raw.githubusercontent.com/Felixdiamond/deepseek-on-android/bankai/install.sh | bash
   ```

5. **First-Time Setup:**
   - The installer will guide you through system requirements
   - Choose your preferred DeepSeek model
   - Set up your admin account
   - Configure performance settings

6. **Start Using DeepSeek:**
   ```bash
   deepseek
   ```
   Access the web interface at http://localhost:8080

## Available Commands

- `deepseek`: Start the DeepSeek services
- `deepseek-stop`: Stop all services
- `deepseek-admin`: Manage admin account
- `deepseek-backup`: Manage backups
- `deepseek-update`: Update Open WebUI
- `optimize-deepseek`: Optimize system performance

## Model Selection

DeepSeek offers two models:
- **deepseek-r1:1.5b (1.1GB)**: Ideal for devices with 8GB RAM
- **deepseek-r1:7b (4.7GB)**: Better quality, requires 12GB+ RAM

The installer will help you choose the appropriate model based on your device's capabilities.

## Features in Detail

### Backup and Restore
```bash
# Create a backup
deepseek-backup create

# List available backups
deepseek-backup list

# Restore from backup
deepseek-backup restore <backup_file>
```

### Admin Account Management
```bash
# Set up or reset admin account
deepseek-admin
```

### Performance Optimization
```bash
# Optimize system performance
optimize-deepseek
```

### System Updates
```bash
# Update Open WebUI to latest version
deepseek-update
```

## Troubleshooting

### Common Issues

1. **"Not enough storage":**
   - Clear package cache: `apt-get clean && apt-get autoclean`
   - Free up device storage
   - Consider using the 1.5B model instead of the 7B model

2. **"Performance is slow":**
   - Run: `optimize-deepseek`
   - Close unnecessary background apps
   - Monitor CPU temperature via the interface

3. **"Out of memory":**
   - Close background apps
   - Switch to the 1.5B model
   - Use `optimize-deepseek` to clear caches

4. **"Services won't start":**
   - Check if you're in the Debian environment: `cat /etc/os-release`
   - Check if Ollama is running: `pgrep ollama`
   - Verify Python version: `python3 --version`
   - Check the logs for specific error messages

## Data Security

- All data is stored locally in `~/.local/share/open-webui/`
- Credentials are stored securely with proper permissions
- Regular backups are recommended using `deepseek-backup`
- No data is sent to external servers

## Acknowledgments

- [Open WebUI](https://github.com/open-webui/open-webui) for the amazing web interface
- [DeepSeek AI](https://github.com/deepseek-ai) for the AI models
- [Ollama](https://github.com/ollama/ollama) for the model management framework
- [Termux](https://github.com/termux) for the Android terminal emulator

## Support

If you find this project helpful, please:
- Star ⭐ the repository
- Report issues or contribute improvements
- Share the project with others

For further questions or support, please [open an issue](../../issues).

**Enjoy the power of local AI with DeepSeek on Android!**