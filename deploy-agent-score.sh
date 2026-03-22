#!/bin/bash
# AgentScore 一键部署脚本
# 用法: bash deploy-agent-score.sh

set -e

SERVER="root@47.85.109.161"
SSH_KEY="$HOME/.ssh/id_agentscore"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -i $SSH_KEY"
REMOTE_DIR="/opt/agent-score"
LOCAL_DIR="$(cd "$(dirname "$0")/agent-score" && pwd)"

echo "==> Packing agent-score..."
cd "$LOCAL_DIR"
tar czf /tmp/agent-score.tar.gz --exclude=node_modules --exclude=.next .

echo "==> Uploading to server..."
scp $SSH_OPTS /tmp/agent-score.tar.gz "$SERVER:/tmp/"

echo "==> Building and restarting on server..."
ssh $SSH_OPTS "$SERVER" "
  mkdir -p $REMOTE_DIR && \
  cd $REMOTE_DIR && \
  rm -rf app lib public *.js *.mjs *.json *.css .next && \
  tar xzf /tmp/agent-score.tar.gz && \
  npm install --production=false 2>&1 | tail -3 && \
  npx next build 2>&1 | tail -5 && \
  pm2 restart agent-score 2>/dev/null || pm2 start npm --name agent-score -- start -- -p 3000 && \
  pm2 save && \
  echo '' && \
  echo 'Deploy complete! http://47.85.109.161:3000'
"

rm /tmp/agent-score.tar.gz
echo "==> Done!"
