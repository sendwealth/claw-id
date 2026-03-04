#!/bin/bash
# CLAW ID 快速启动脚本
# 用法: ./quick-start.sh [start|stop|test|status]

PRODUCTS_DIR=~/clawd/products/claw-id
BACKEND_DIR=$PRODUCTS_DIR/backend
LOG_FILE=~/clawd/memory/claw-id-$(date +%Y%m%d).log

case "$1" in
  start)
    echo "🚀 启动 CLAW ID 后端..."
    cd $BACKEND_DIR
    node src/app.js > $LOG_FILE 2>&1 &
    echo $! > /tmp/claw-id-backend.pid
    sleep 3
    curl -s http://localhost:3000/health | jq .
    echo "✅ 后端已启动 (PID: $(cat /tmp/claw-id-backend.pid))"
    ;;

  stop)
    echo "🛑 停止 CLAW ID 后端..."
    if [ -f /tmp/claw-id-backend.pid ]; then
      kill $(cat /tmp/claw-id-backend.pid) 2>/dev/null
      rm /tmp/claw-id-backend.pid
      echo "✅ 后端已停止"
    else
      echo "⚠️  后端未运行"
    fi
    ;;

  restart)
    $0 stop
    sleep 2
    $0 start
    ;;

  test)
    echo "🧪 测试 CLAW ID API..."

    echo "\n1️⃣ 健康检查"
    curl -s http://localhost:3000/health | jq .

    echo "\n2️⃣ 创建测试 Agent"
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/agents \
      -H "Content-Type: application/json" \
      -d "{\"name\":\"Test Agent $(date +%H%M%S)\",\"platforms\":[\"github\"]}")
    echo $RESPONSE | jq .

    AGENT_ID=$(echo $RESPONSE | jq -r '.id')
    API_KEY=$(echo $RESPONSE | jq -r '.apiKey')

    echo "\n3️⃣ 查询 Agent 列表"
    curl -s "http://localhost:3000/api/v1/agents?page=1&limit=5" | jq .

    echo "\n4️⃣ 查询 Agent 详情"
    curl -s "http://localhost:3000/api/v1/agents/$AGENT_ID" | jq .

    echo "\n✅ 测试完成"
    echo "Agent ID: $AGENT_ID"
    echo "API Key: $API_KEY"
    ;;

  status)
    echo "📊 CLAW ID 状态"
    if [ -f /tmp/claw-id-backend.pid ]; then
      PID=$(cat /tmp/claw-id-backend.pid)
      if ps -p $PID > /dev/null 2>&1; then
        echo "✅ 后端运行中 (PID: $PID)"
        curl -s http://localhost:3000/health | jq .
      else
        echo "❌ 后端已停止（PID 文件存在但进程不存在）"
        rm /tmp/claw-id-backend.pid
      fi
    else
      echo "⚠️  后端未运行"
    fi
    ;;

  logs)
    echo "📜 CLAW ID 日志（最近 50 行）"
    if [ -f $LOG_FILE ]; then
      tail -50 $LOG_FILE
    else
      echo "⚠️  日志文件不存在: $LOG_FILE"
    fi
    ;;

  *)
    echo "用法: $0 {start|stop|restart|test|status|logs}"
    echo ""
    echo "命令说明:"
    echo "  start   - 启动后端服务"
    echo "  stop    - 停止后端服务"
    echo "  restart - 重启后端服务"
    echo "  test    - 运行 API 测试"
    echo "  status  - 查看服务状态"
    echo "  logs    - 查看最新日志"
    exit 1
    ;;
esac
