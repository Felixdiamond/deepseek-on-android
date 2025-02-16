# DeepSeek on Android 🚀

Run DeepSeek AI models locally on your Android device with automated installation and a user-friendly interface.

## Overview

This project provides tools and scripts to run DeepSeek models locally on Android devices, offering complete privacy, offline access, and customization options. Instead of relying on cloud services, you can harness the power of AI directly on your device.

## Features

- 🔒 **Complete Privacy**: All processing happens locally on your device
- 🌐 **Offline Access**: No internet connection required after initial setup
- ⚡ **Automated Setup**: Simple installation process with scripts
- 🎨 **User-Friendly Interface**: Easy-to-use frontend application (i hope)

## Requirements

### Hardware
- **Processor**: Snapdragon 8 Gen 2/3 or equivalent (REQUIRED)
- **RAM**: 8GB+ RAM (12GB+ recommended for 7B model)
- **Storage**: 12GB+ free storage space

### Software
- Android 10 or higher
- [Termux](https://github.com/termux/termux-app/releases) (Latest version)

## Quick Start

1. Install Termux from [F-Droid](https://f-droid.org/packages/com.termux/) or [GitHub](https://github.com/termux/termux-app/releases)

2. Run the automated installation:
```bash
pkg update && pkg upgrade
pkg install curl
curl -sSL https://raw.githubusercontent.com/Felixdiamond/deepseek-android/main/install.sh | bash
```

3. Start DeepSeek:
```bash
deepseek
```

That's it! The installation script handles everything automatically, including:
- System requirements check
- Package installation
- Model download
- Frontend setup
- Performance optimization

⚠️ **Note**: First run will take some time as it downloads the model (5.7GB for 1.5B model, 12GB for 7B model).

## Available Models

- `deepseek-r1:1.5b` (5.7GB) - Best for devices with 8GB RAM
- `deepseek-r1:7b` (12GB) - Better quality, requires 12GB+ RAM

⚠️ **Important**: The 7B model requires a Snapdragon 8 Gen 2/3 or equivalent processor for acceptable performance.

## Features

### Privacy Features
- 100% offline after initial setup
- No data sent to external servers
- All processing done locally

### Performance Tools
- RAM usage monitoring
- CPU temperature tracking
- Performance optimization script
- Wake lock to prevent sleep

## Performance Tips

1. **Before Starting**:
   - Close background apps
   - Run the optimizer: `optimize-deepseek`
   - Keep device plugged in for best performance

2. **Model Selection**:
   - Start with 1.5B model to test performance
   - Upgrade to 7B if device handles it well
   - Monitor RAM usage in the interface

3. **Troubleshooting**:
   - If responses are slow, try the optimizer
   - If out of memory, switch to 1.5B model
   - Check CPU temperature in the interface

## Manual Installation

If you prefer to install manually or need to troubleshoot:

1. Clone the repository:
```bash
git clone https://github.com/Felixdiamond/deepseek-android.git
cd deepseek-android
```

2. Run the installation script:
```bash
chmod +x install.sh
./install.sh
```

## Troubleshooting

### Common Issues

1. **"Not enough storage"**:
   - Clear Termux cache: `apt clean && apt autoclean`
   - Free up device storage
   - Try 1.5B model instead of 7B

2. **"Performance is slow"**:
   - Run: `optimize-deepseek`
   - Close background apps
   - Check CPU temperature in interface
   - Consider switching to 1.5B model

3. **"Out of memory"**:
   - Close background apps
   - Switch to 1.5B model
   - Clear RAM: `optimize-deepseek`

4. **"Frontend won't start"**:
   - Check if Ollama is running: `pgrep ollama`
   - Reinstall Python dependencies: `pip install -r requirements.txt`
   - Check logs in terminal

## Acknowledgments

- [DeepSeek AI](https://github.com/deepseek-ai) for the amazing models
- [Ollama](https://github.com/ollama/ollama) for the model management framework
- [Termux](https://github.com/termux) for the Android terminal emulator
- **The following blogs (literally carried the project)**:
  - [Install DeepSeek on Android](https://www.androidauthority.com/install-deepseek-android-3521203/) - Android Authority
  - [How to Run DeepSeek R1 1.5B LLM on Android Using Termux](https://www.qed42.com/insights/how-to-run-deepseek-r1-1-5b-llm-on-android-using-termux) - QED42

## Support

If you find this project helpful, please consider:
- Starring ⭐ the repository
- Reporting issues
- Contributing improvements
- Sharing with others

For questions and support, please [open an issue](../../issues).