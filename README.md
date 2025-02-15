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

2. Clone and install:
```bash
pkg update && pkg upgrade
pkg install git
git clone https://github.com/Felixdiamond/deepseek-android.git
cd deepseek-android
chmod +x install.sh
./install.sh
```

3. Launch the frontend application:
```bash
./start_frontend.sh
```

⚠️ **Note**: First run will take some time as it downloads the model (5.7GB for 1.5B model, 12GB for 7B model).

## Available Models

- `deepseek-r1:1.5b` (5.7GB) - Best for devices with 8GB RAM
- `deepseek-r1:7b` (12GB) - Better quality, requires 12GB+ RAM

⚠️ **Important**: The 7B model requires a Snapdragon 8 Gen 2/3 or equivalent processor for acceptable performance.

## Performance Tips

1. **Memory Management**:
   - Close background apps before running models
   - Monitor RAM usage with `top` command
   - For 7B model, ensure at least 12GB RAM is available

2. **Battery Optimization**:
   - Keep device plugged in during long sessions
   - Use `termux-wake-lock` to prevent sleep
   ```bash
   pkg install termux-services
   sv-enable termux-wake-lock
   ```

3. **Storage Management**:
   - Clear Termux cache periodically:
   ```bash
   apt clean && apt autoclean
   ```

## Detailed Installation

For manual installation or troubleshooting, follow these steps:

1. Install Termux and grant storage permissions:
```bash
termux-setup-storage
```

2. Update packages and install dependencies:
```bash
pkg update && pkg upgrade
pkg install git cmake golang libjpeg-turbo
```

3. Install Ollama:
```bash
git clone --depth 1 https://github.com/ollama/ollama.git
cd ollama
go generate ./...
go build
```

4. Download and run the DeepSeek model:
```bash
./ollama run deepseek-r1:7b
```

## Troubleshooting

### Common Issues

1. **"Permission Denied" Error**:
   ```bash
   termux-setup-storage
   chmod +x install.sh
   ```

2. **"Out of Memory" Error**:
   - Switch to a smaller model (e.g., deepseek-r1:1.5b)
   - Close background apps
   - Clear RAM: `sync && echo 3 > /proc/sys/vm/drop_caches`

3. **Slow Performance**:
   - Use quantized models
   - Ensure device is in high-performance mode
   - Check CPU governor: `cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor`

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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