#!/bin/bash
# ==============================================================
# AgentSite Kit — 一键部署/更新脚本 (scp + SSH + systemd)
# 用法: bash deploy.sh
# ==============================================================
set -e

# ==================== 配置区 ====================
REMOTE_HOST="root@47.85.109.161"
REMOTE_DIR="/opt/agentsite-kit"
LOCAL_DIR="$(cd "$(dirname "$0")" && pwd)"
# ================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }

echo ""
echo "============================================"
echo "  AgentSite Kit Deploy -> $REMOTE_HOST"
echo "============================================"
echo ""

# ------ 0. 本地构建 ------
if [ ! -d "$LOCAL_DIR/dist" ]; then
  warn "dist/ not found, building..."
  cd "$LOCAL_DIR" && npm run build
fi
log "Local build ready"

# ------ 1. 服务器环境初始化 ------
echo ""
echo "[1/5] Checking server environment..."
ssh "$REMOTE_HOST" bash <<'INIT_EOF'
set -e

# Node.js
if ! command -v node &>/dev/null; then
  echo ">>> Installing Node.js 20..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - 2>/dev/null \
    || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null)
  yum install -y nodejs 2>/dev/null || apt-get install -y nodejs 2>/dev/null
fi
echo "Node $(node -v) ready"

# curl (health check)
if ! command -v curl &>/dev/null; then
  yum install -y curl 2>/dev/null || apt-get install -y curl 2>/dev/null
fi

mkdir -p /opt/agentsite-kit/.agentsite/cache/pages
mkdir -p /opt/agentsite-kit/.agentsite/data
INIT_EOF
log "Server environment ready"

# ------ 2. 打包上传 ------
echo ""
echo "[2/5] Packing and uploading..."

TMPFILE="/tmp/agentsite-deploy.tar.gz"
cd "$LOCAL_DIR"
tar czf "$TMPFILE" \
  --exclude='node_modules' \
  --exclude='.agentsite' \
  --exclude='.git' \
  --exclude='.env' \
  dist/ templates/ bin/ package.json package-lock.json

scp "$TMPFILE" "$REMOTE_HOST:/tmp/agentsite-deploy.tar.gz"

ssh "$REMOTE_HOST" bash <<EXTRACT_EOF
set -e
cd $REMOTE_DIR
tar xzf /tmp/agentsite-deploy.tar.gz
rm -f /tmp/agentsite-deploy.tar.gz

# 如果没有配置文件，自动生成默认配置
if [ ! -f agentsite.config.yaml ]; then
  echo ">>> No config found, generating default..."
  cat > agentsite.config.yaml <<'YAML'
site:
  url: "https://example.com"
  name: "My Site"
  description: "AgentSite Kit default config"

scan:
  maxPages: 100
  concurrency: 3
  delayMs: 200
  include:
    - "**"
  exclude: []
  respectRobotsTxt: true

output:
  dir: ".agentsite"
  formats:
    - llms-txt
    - agent-sitemap
    - agent-index
    - structured

server:
  port: 3141
  rateLimit:
    max: 60
    timeWindow: "1 minute"
  accessLog: true

access:
  allowedPages:
    - "**"
  blockedPages: []
  allowedTypes:
    - docs
    - faq
    - blog
    - product
    - pricing
    - about
    - contact
    - changelog
  summaryOnly: false
  allowSearch: true
YAML
  echo "Default config created. Edit $REMOTE_DIR/agentsite.config.yaml to set your site URL."
fi
EXTRACT_EOF

rm -f "$TMPFILE"
log "Upload complete"

# ------ 3. 安装依赖 ------
echo ""
echo "[3/5] Installing dependencies..."
ssh "$REMOTE_HOST" bash <<DEPS_EOF
set -e
cd $REMOTE_DIR
npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev --ignore-scripts
DEPS_EOF
log "Dependencies ready"

# ------ 4. systemd 服务 ------
echo ""
echo "[4/5] Configuring systemd service..."
ssh "$REMOTE_HOST" bash <<'SERVICE_EOF'
set -e

cat > /etc/systemd/system/agentsite.service <<'UNIT'
[Unit]
Description=AgentSite Kit API Server
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/agentsite-kit
ExecStart=/usr/bin/node bin/agentsite.js serve
Restart=always
RestartSec=5
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable agentsite
systemctl restart agentsite
sleep 3

if systemctl is-active --quiet agentsite; then
  echo "Service started"
else
  echo "Service failed:"
  journalctl -u agentsite -n 20 --no-pager
  exit 1
fi
SERVICE_EOF
log "Service running"

# ------ 5. 健康检查 ------
echo ""
echo "[5/5] Health check..."
HEALTH=$(ssh "$REMOTE_HOST" 'curl -sf http://localhost:3141/api/health 2>/dev/null || echo "FAIL"')

if echo "$HEALTH" | grep -q '"ok":true'; then
  log "Deploy successful!"
  echo ""
  echo "============================================"
  echo "  API:       http://47.85.109.161:3141"
  echo "  Dashboard: http://47.85.109.161:3141/"
  echo "============================================"
  echo ""
else
  warn "Health check pending, check logs:"
  echo "  ssh $REMOTE_HOST 'journalctl -u agentsite -n 30'"
fi
