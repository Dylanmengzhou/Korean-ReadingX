#!/bin/bash

# 测试认证系统 API

echo "🧪 测试认证系统 API..."
echo ""

# 测试注册 API
echo "1. 测试用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test12345",
    "name": "Test User"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "error"; then
  ERROR_MSG=$(echo "$REGISTER_RESPONSE" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
  echo "   ⚠️  注册响应: $ERROR_MSG"
else
  echo "   ✅ 注册成功或用户已存在"
fi

echo ""
echo "📋 完整响应:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

echo "💡 提示:"
echo "  - 访问 http://localhost:3000/auth/register 测试注册页面"
echo "  - 访问 http://localhost:3000/auth/login 测试登录页面"
echo "  - 访问 http://localhost:3000/articleList 测试受保护路由"
