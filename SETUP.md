# Hermes Web UI 本地启动指南

## 环境要求

- Python 3.12+
- Linux / macOS / WSL2

## 启动步骤

### 1. 安装 Web UI 依赖

```bash
pip3 install --break-system-packages -r requirements.txt
```

### 2. 安装 Hermes Agent 核心依赖

Web UI 依赖 hermes-agent 的 `run_agent` 模块，需要额外安装以下包：

```bash
pip3 install --break-system-packages \
  openai \
  'anthropic>=0.39.0' \
  python-dotenv \
  fire \
  httpx \
  rich \
  tenacity \
  prompt_toolkit \
  pyyaml \
  requests \
  jinja2 \
  'pydantic>=2.0' \
  'PyJWT[crypto]'
```

### 3. 配置 API Key

确保 `~/.hermes/config.yaml` 中配置了有效的模型 API Key（OpenAI / Anthropic 等），否则聊天功能无法正常工作。

### 4. 启动服务器

```bash
python3 server.py
```

服务默认监听 `http://127.0.0.1:8787`。

如需远程访问，可通过 SSH 隧道：

```bash
ssh -N -L 8787:127.0.0.1:8787 <user>@<your-server>
```

## 启动过程中遇到的问题及解决方案

### 问题 1：`ModuleNotFoundError: No module named 'openai'`

`requirements.txt` 只声明了 Web UI 自身的依赖（仅 `pyyaml`），但运行时会加载 hermes-agent 的 `run_agent` 模块，该模块依赖 `openai` 等一系列包。服务器虽然能启动，但发送消息时 SSE 流连接会立即断开，前端报 "Connection lost"。

解决：手动安装 hermes-agent 的核心依赖（见步骤 2）。

### 问题 2：`The 'anthropic' package is required for the Anthropic provider`

安装 `openai` 后聊天功能仍报错，因为配置文件中使用的是 Anthropic 模型，而 `anthropic` SDK 未安装。

解决：额外安装 `anthropic>=0.39.0`。

### 可忽略的警告

以下两个警告不影响核心聊天功能，属于可选插件：

- `No module named 'firecrawl'` — 网页抓取工具，需要时执行 `pip3 install firecrawl-py`
- `No module named 'fal_client'` — 图片生成工具，需要时执行 `pip3 install fal-client`
