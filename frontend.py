import streamlit as st
import requests
import json
import os
import subprocess
from datetime import datetime
import time
import markdown
import re
from streamlit.components.v1 import html
from typing import Optional

# Set page config
st.set_page_config(
    page_title="DeepSeek Android",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for a more professional look
st.markdown("""
<style>
    /* Global styles */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
    
    * {
        font-family: 'Inter', sans-serif;
    }
    
    /* Main container */
    .main {
        background-color: #ffffff;
        max-width: 1200px;
        margin: 0 auto;
        padding: 0;
    }
    
    /* Hide Streamlit elements */
    #MainMenu, header, footer {display: none;}
    .stDeployButton {display: none;}
    
    /* Sidebar */
    .css-1d391kg {
        background-color: #f7f7f8;
        border-right: 1px solid #e5e5e5;
        padding: 2rem 1rem;
    }
    
    /* Chat container */
    .chat-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
        height: calc(100vh - 180px);
        overflow-y: auto;
        scroll-behavior: smooth;
    }
    
    /* Message bubbles */
    .chat-message {
        display: flex;
        padding: 2rem;
        margin: 0;
        border-bottom: 1px solid #e5e5e5;
        transition: background-color 0.3s ease;
    }
    
    .chat-message:hover {
        background-color: #f9f9f9;
    }
    
    .user-message {
        background-color: #ffffff;
    }
    
    .bot-message {
        background-color: #f7f7f8;
    }
    
    .message-container {
        display: flex;
        gap: 1.5rem;
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
    }
    
    .avatar {
        width: 30px;
        height: 30px;
        border-radius: 4px;
        flex-shrink: 0;
    }
    
    .message-content {
        flex-grow: 1;
        overflow-x: auto;
    }
    
    .message-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    
    .message-header strong {
        font-size: 1rem;
        color: #1a1a1a;
    }
    
    .message-text {
        font-size: 1rem;
        line-height: 1.6;
        color: #1a1a1a;
        white-space: pre-wrap;
    }
    
    /* Code blocks */
    .code-block {
        position: relative;
        background-color: #1e1e1e;
        border-radius: 6px;
        margin: 1rem 0;
    }
    
    .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background-color: #2d2d2d;
        border-top-left-radius: 6px;
        border-top-right-radius: 6px;
        border-bottom: 1px solid #3d3d3d;
    }
    
    .code-language {
        color: #808080;
        font-size: 0.85rem;
    }
    
    .copy-button {
        background: none;
        border: none;
        color: #808080;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        font-size: 0.85rem;
        transition: color 0.3s ease;
    }
    
    .copy-button:hover {
        color: #ffffff;
    }
    
    .code-content {
        padding: 1rem;
        overflow-x: auto;
        font-family: 'Fira Code', monospace;
        font-size: 0.9rem;
        line-height: 1.5;
        color: #d4d4d4;
    }
    
    /* Input area */
    .input-container {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background-color: #ffffff;
        border-top: 1px solid #e5e5e5;
        padding: 1.5rem 2rem;
        z-index: 1000;
    }
    
    .input-box {
        max-width: 800px;
        margin: 0 auto;
        position: relative;
    }
    
    .stTextArea > div > div > textarea {
        background-color: #ffffff;
        border: 1px solid #e5e5e5;
        border-radius: 1rem;
        padding: 1rem;
        font-size: 1rem;
        resize: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
        min-height: 60px;
        max-height: 200px;
        overflow-y: auto;
    }
    
    .stTextArea > div > div > textarea:focus {
        border-color: #0066cc;
        box-shadow: 0 2px 8px rgba(0,102,204,0.1);
    }
    
    /* Buttons */
    .stButton > button {
        background-color: #0066cc;
        color: white;
        border: none;
        border-radius: 0.5rem;
        padding: 0.75rem 1.5rem;
        font-weight: 500;
        transition: all 0.3s ease;
        height: 100%;
    }
    
    .stButton > button:hover {
        background-color: #0052a3;
        transform: translateY(-1px);
    }
    
    .stButton > button:active {
        transform: translateY(0);
    }
    
    /* System stats */
    .system-stats {
        background-color: #ffffff;
        border-radius: 0.75rem;
        padding: 1.25rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        margin-bottom: 1.5rem;
    }
    
    /* Model selector */
    .model-selector {
        background-color: #ffffff;
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    /* Markdown content */
    .markdown-content h1 { font-size: 1.5rem; margin: 1.5rem 0 1rem; }
    .markdown-content h2 { font-size: 1.25rem; margin: 1.25rem 0 0.75rem; }
    .markdown-content h3 { font-size: 1.1rem; margin: 1rem 0 0.5rem; }
    .markdown-content p { margin: 0.75rem 0; }
    .markdown-content ul, .markdown-content ol { margin: 0.75rem 0; padding-left: 1.5rem; }
    .markdown-content li { margin: 0.25rem 0; }
    .markdown-content code { font-family: 'Fira Code', monospace; padding: 0.2rem 0.4rem; background-color: #f1f1f1; border-radius: 3px; }
    .markdown-content pre { margin: 1rem 0; }
    .markdown-content blockquote { border-left: 4px solid #e5e5e5; margin: 1rem 0; padding-left: 1rem; color: #666; }
    
    /* Loading animation */
    @keyframes pulse {
        0% { opacity: 0.4; }
        50% { opacity: 0.7; }
        100% { opacity: 0.4; }
    }
    
    .loading-dots {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 2rem;
    }
    
    .dot {
        width: 8px;
        height: 8px;
        background-color: #0066cc;
        border-radius: 50%;
        animation: pulse 1.5s infinite;
    }
    
    .dot:nth-child(2) { animation-delay: 0.2s; }
    .dot:nth-child(3) { animation-delay: 0.4s; }
    
    /* Welcome screen */
    .welcome-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 60vh;
        text-align: center;
        padding: 2rem;
    }
    
    .welcome-title {
        font-size: 2.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
        background: linear-gradient(135deg, #0066cc, #00ccff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    
    .welcome-subtitle {
        font-size: 1.2rem;
        color: #666;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
    }
    
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin-top: 3rem;
        max-width: 800px;
        width: 100%;
    }
    
    .feature-card {
        background-color: #f7f7f8;
        border-radius: 1rem;
        padding: 1.5rem;
        text-align: left;
        transition: transform 0.3s ease;
    }
    
    .feature-card:hover {
        transform: translateY(-5px);
    }
    
    .feature-icon {
        font-size: 1.5rem;
        margin-bottom: 1rem;
    }
    
    .feature-title {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
        color: #1a1a1a;
    }
    
    .feature-description {
        font-size: 0.9rem;
        color: #666;
        line-height: 1.4;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'model' not in st.session_state:
    st.session_state.model = "deepseek-r1:1.5b"
if 'thinking' not in st.session_state:
    st.session_state.thinking = False
if 'streaming' not in st.session_state:
    st.session_state.streaming = False

def format_code_blocks(content: str) -> str:
    """Format code blocks with copy buttons and syntax highlighting."""
    code_block_pattern = r"```(\w+)?\n(.*?)\n```"
    
    def replace_code_block(match):
        language = match.group(1) or "text"
        code = match.group(2)
        
        return f"""
        <div class="code-block">
            <div class="code-header">
                <span class="code-language">{language}</span>
                <button class="copy-button" onclick="navigator.clipboard.writeText(`{code.replace('`', '\\`')}`)">
                    Copy code
                </button>
            </div>
            <div class="code-content">{code}</div>
        </div>
        """
    
    return re.sub(code_block_pattern, replace_code_block, content, flags=re.DOTALL)

def format_message(content: str) -> str:
    """Convert markdown to HTML and format code blocks."""
    # First format code blocks
    content_with_code = format_code_blocks(content)
    
    # Convert remaining markdown to HTML
    html_content = markdown.markdown(content_with_code, extensions=['fenced_code', 'tables'])
    
    return f'<div class="markdown-content">{html_content}</div>'

# Sidebar
with st.sidebar:
    st.title("DeepSeek Android")
    st.markdown("---")
    
    # Model selection with improved UI
    st.markdown("""
        <div class="model-selector">
            <h3 style='margin-bottom: 0.5rem;'>Model Settings</h3>
        </div>
    """, unsafe_allow_html=True)
    
    model = st.selectbox(
        "Select Model",
        ["deepseek-r1:1.5b", "deepseek-r1:7b"],
        index=0,
        help="1.5B model is recommended for most devices. 7B model requires Snapdragon 8 Gen 2/3 and 12GB+ RAM."
    )
    
    if model != st.session_state.model:
        if model == "deepseek-r1:7b":
            st.warning("⚠️ The 7B model requires Snapdragon 8 Gen 2/3 and 12GB+ RAM for acceptable performance.")
        st.session_state.model = model
        st.session_state.messages = []
    
    # System stats with improved UI
    st.markdown("---")
    st.markdown("""
        <div class="system-stats">
            <h3 style='margin-bottom: 0.5rem;'>System Stats</h3>
        </div>
    """, unsafe_allow_html=True)
    
    def get_ram_usage():
        try:
            total, used, free = map(int, os.popen('free -t -m').readlines()[-1].split()[1:])
            return round((used/total) * 100, 2)
        except:
            return 0
    
    def get_cpu_temp():
        try:
            temp = os.popen('cat /sys/class/thermal/thermal_zone0/temp').read()
            return round(float(temp)/1000, 1)
        except:
            return 0
    
    ram_usage = get_ram_usage()
    cpu_temp = get_cpu_temp()
    
    col1, col2 = st.columns(2)
    with col1:
        st.metric("RAM Usage", f"{ram_usage}%", 
                 delta=None if ram_usage < 80 else "High",
                 delta_color="inverse")
    with col2:
        st.metric("CPU Temp", f"{cpu_temp}°C",
                 delta=None if cpu_temp < 70 else "High",
                 delta_color="inverse")
    
    # Performance optimization
    if st.button("Optimize Performance", help="Clear RAM and set CPU governor to performance mode"):
        with st.spinner("Optimizing system..."):
            try:
                subprocess.run(['optimize-deepseek'], check=True)
                st.success("✅ System optimized!")
            except:
                st.error("❌ Failed to optimize system")
    
    # Clear chat with improved UI
    if st.button("Clear Chat", help="Clear all chat history"):
        st.session_state.messages = []
        st.experimental_rerun()

# Main chat interface
st.markdown('<div class="chat-container">', unsafe_allow_html=True)

# Welcome message if no messages
if not st.session_state.messages:
    st.markdown("""
        <div class="welcome-container">
            <h1 class="welcome-title">Welcome to DeepSeek Android! 🤖</h1>
            <p class="welcome-subtitle">
                Experience the power of AI, completely offline and private on your device.
                Ask me anything - from coding to creative writing, I'm here to help!
            </p>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <div class="feature-title">100% Private</div>
                    <div class="feature-description">All processing happens locally on your device.</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-title">Lightning Fast</div>
                    <div class="feature-description">Optimized for mobile processors.</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🌐</div>
                    <div class="feature-title">Offline Access</div>
                    <div class="feature-description">No internet required after setup.</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🎨</div>
                    <div class="feature-title">Versatile</div>
                    <div class="feature-description">From coding to creative tasks.</div>
                </div>
            </div>
        </div>
    """, unsafe_allow_html=True)

# Display chat messages
for idx, message in enumerate(st.session_state.messages):
    with st.container():
        if message["role"] == "user":
            st.markdown(f"""
                <div class="chat-message user-message">
                    <div class="message-container">
                        <img class="avatar" src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="User">
                        <div class="message-content">
                            <div class="message-header">
                                <strong>You</strong>
                            </div>
                            <div class="message-text">{message["content"]}</div>
                        </div>
                    </div>
                </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown(f"""
                <div class="chat-message bot-message">
                    <div class="message-container">
                        <img class="avatar" src="https://api.dicebear.com/7.x/bottts/svg?seed=deepseek" alt="DeepSeek">
                        <div class="message-content">
                            <div class="message-header">
                                <strong>DeepSeek</strong>
                            </div>
                            {format_message(message["content"])}
                        </div>
                    </div>
                </div>
            """, unsafe_allow_html=True)

# Show thinking animation
if st.session_state.thinking:
    st.markdown("""
        <div class="chat-message bot-message">
            <div class="message-container">
                <img class="avatar" src="https://api.dicebear.com/7.x/bottts/svg?seed=deepseek" alt="DeepSeek">
                <div class="message-content">
                    <div class="message-header">
                        <strong>DeepSeek</strong>
                    </div>
                    <div class="loading-dots">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>
            </div>
        </div>
    """, unsafe_allow_html=True)

# Input area
st.markdown('<div class="input-container">', unsafe_allow_html=True)
with st.container():
    col1, col2 = st.columns([6, 1])
    
    with col1:
        user_input = st.text_area(
            "Type your message...", 
            key="user_input",
            height=60,
            placeholder="Message DeepSeek... (Press Shift+Enter to send)",
            label_visibility="collapsed"
        )
    
    with col2:
        send_button = st.button("Send", use_container_width=True)

# Handle input
if (send_button or (user_input and user_input.strip() and "\n" in user_input)) and not st.session_state.thinking:
    # Add user message
    st.session_state.messages.append({"role": "user", "content": user_input.strip()})
    
    # Show thinking indicator
    st.session_state.thinking = True
    st.experimental_rerun()

# Handle API call in a separate block to avoid nested rerun
if st.session_state.thinking and not st.session_state.streaming:
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": st.session_state.model,
                "prompt": st.session_state.messages[-1]["content"],
                "stream": True
            },
            stream=True
        )
        
        if response.status_code == 200:
            # Initialize streaming
            st.session_state.streaming = True
            st.session_state.current_response = ""
            
            # Process the stream
            for line in response.iter_lines():
                if line:
                    chunk = json.loads(line)
                    if "response" in chunk:
                        st.session_state.current_response += chunk["response"]
                        # Update the message
                        if len(st.session_state.messages) > 0 and st.session_state.messages[-1]["role"] == "user":
                            st.session_state.messages.append({"role": "assistant", "content": st.session_state.current_response})
                        else:
                            st.session_state.messages[-1]["content"] = st.session_state.current_response
                        st.experimental_rerun()
                    
                    if "done" in chunk and chunk["done"]:
                        # Streaming complete
                        st.session_state.streaming = False
                        st.session_state.thinking = False
                        st.experimental_rerun()
        else:
            st.error("Failed to get response from the model")
            st.session_state.thinking = False
            st.session_state.streaming = False
    except Exception as e:
        st.error(f"Error: {str(e)}")
        st.session_state.thinking = False
        st.session_state.streaming = False
    
    if not st.session_state.streaming:
        st.experimental_rerun()

st.markdown('</div>', unsafe_allow_html=True)  # Close input container
st.markdown('</div>', unsafe_allow_html=True)  # Close chat container

# Add padding for the fixed input container
st.markdown('<div style="height: 150px;"></div>', unsafe_allow_html=True)