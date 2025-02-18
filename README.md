# DeepSeek on Android 🚀

Run DeepSeek AI models locally on your Android device with automated installation and a user-friendly interface.

## Overview

This project provides tools and scripts to run DeepSeek models locally on Android devices, offering complete privacy, offline access, and customization options. Instead of relying on cloud services, you can harness the power of AI directly on your device.

## Features

- 🔒 **Complete Privacy**: All processing happens locally on your device
- 🌐 **Offline Access**: No internet connection required after initial setup
- ⚡ **Automated Setup**: Simple installation process with scripts
- 🎨 **User-Friendly Interface**: Easy-to-use frontend application (i hope)

## System Requirements

### Hardware
- **Processor:** Snapdragon 8 Gen 2/3 (or equivalent) — required for optimal performance.
- **RAM:** Minimum **8GB** (12GB+ recommended for the 7B model).
- **Storage:** At least **12GB** of free storage.

### Software
- Android 10 or higher
- [Termux](https://github.com/termux/termux-app/releases) (Latest version)

## Getting Started

### Automated Installation

1. **Install Termux:**  
   Download Termux from [F-Droid](https://f-droid.org/packages/com.termux/) or [GitHub](https://github.com/termux/termux-app/releases).

2. **Run the Installation Script:**  
   This script installs all dependencies (Node.js, Yarn, Ollama, etc.), sets up performance optimizations, and prepares the Next.js frontend.
   ```bash
   curl -sSL https://raw.githubusercontent.com/Felixdiamond/deepseek-on-android/bankai/install.sh | bash
   ```

3. **Start DeepSeek:**  
   Once the installation finishes, simply run:
   ```bash
   deepseek
   ```
   This command checks if the Ollama service is running (starting it if necessary) and then launches the Next.js frontend.

## Model Selection

DeepSeek offers two models:
- **deepseek-r1:1.5b (1.1GB)**: Ideal for devices with 8GB RAM.
- **deepseek-r1:7b (4.7GB)**: Provides better quality, but requires 12GB+ RAM.

When prompted during installation, choose the appropriate model. If an invalid choice is made, the installer defaults to `deepseek-r1:1.5b`.

## Frontend Interface

The Next.js–based frontend offers:
- **Real-Time Streaming:**  
  The chat API endpoint streams responses using HTTP TransformStreams for low-latency interaction.
  
- **Responsive UI:**  
  Enjoy a modern, mobile-optimized interface built with React and Next.js.

- **Seamless Ollama Integration:**  
  The Frontend API routes ensure that Ollama is running before sending chat prompts and handle streaming responses from local model inference.
  
> **Note:**  
> Any legacy files or scripts referring to the Streamlit frontend (e.g., `start_frontend.sh` or `frontend.py`) are deprecated and should not be used.

## Performance Optimization

Before starting a lengthy chat session, please follow these steps for the best performance:

1. **Close background apps.**
2. **Run the performance optimizer:**  
   ```bash
   optimize-deepseek
   ```
   This command clears caches and sets your CPU governor to performance mode.
3. **Keep your device plugged in** for stable power during heavy inference.

## Troubleshooting

### Common Issues

1. **"Not enough storage":**
   - Clear Termux cache: `apt clean && apt autoclean`
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

4. **"Frontend won't start":**
   - Ensure Ollama is running (`pgrep ollama`)
   - Reinstall any missing dependencies (`pip install -r requirements.txt` for Python utilities, if needed)
   - Check the terminal logs for specific error messages

## Manual Installation

If you prefer to install manually or debug issues:

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Felixdiamond/deepseek-on-android.git
   cd deepseek-on-android
   ```

2. **Run the Installer:**
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Start the Frontend:**
   ```bash
   deepseek
   ```

## Acknowledgments

- [DeepSeek AI](https://github.com/deepseek-ai) for the AI models.
- [Ollama](https://github.com/ollama/ollama) for the model management framework.
- [Termux](https://github.com/termux) for the Android terminal emulator.
- Thanks to the blogs and community members who have contributed to this project:
  - [Install DeepSeek on Android](https://www.androidauthority.com/install-deepseek-android-3521203/) – Android Authority.
  - [How to Run DeepSeek R1 1.5B LLM on Android Using Termux](https://www.qed42.com/insights/how-to-run-deepseek-r1-1-5b-llm-on-android-using-termux) – QED42.

## Support

If you find this project helpful, please consider:
- Starring ⭐ the repository.
- Reporting issues or contributing improvements.
- Sharing the project with others.

For further questions or support, please [open an issue](../../issues).

**Enjoy the power of local AI with DeepSeek on Android!**