#!/bin/bash

# 认证系统测试脚本

echo "🔍 检查认证系统配置..."
echo ""

# 检查必要的文件
echo "📁 检查文件是否存在..."
files=(
  "auth.ts"
  "auth.config.ts"
  "middleware.ts"
  "app/api/auth/register/route.ts"
  "app/auth/login/page.tsx"
  "app/auth/register/page.tsx"
  "components/providers/session-provider.tsx"
  "components/custom/user-button.tsx"
  "lib/auth-helpers.ts"
  "prisma/schema.prisma"
)

all_exist=true
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✅ $file"
  else
    echo "  ❌ $file (缺失)"
    all_exist=false
  fi
done

echo ""

# 检查环境变量
echo "🔐 检查环境变量..."
if [ -f ".env.local" ] || [ -f ".env" ]; then
  env_file=".env.local"
  [ ! -f "$env_file" ] && env_file=".env"
  
  if grep -q "DATABASE_URL" "$env_file"; then
    echo "  ✅ DATABASE_URL"
  else
    echo "  ❌ DATABASE_URL (缺失)"
    all_exist=false
  fi
  
  if grep -q "AUTH_SECRET" "$env_file"; then
    echo "  ✅ AUTH_SECRET"
  else
    echo "  ❌ AUTH_SECRET (缺失)"
    all_exist=false
  fi
else
  echo "  ❌ .env 或 .env.local 文件不存在"
  all_exist=false
fi

echo ""

# 检查依赖包
echo "📦 检查依赖包..."
packages=("bcryptjs" "@types/bcryptjs" "next-auth" "@auth/prisma-adapter")
for pkg in "${packages[@]}"; do
  if npm list "$pkg" > /dev/null 2>&1; then
    echo "  ✅ $pkg"
  else
    echo "  ❌ $pkg (未安装)"
    all_exist=false
  fi
done

echo ""

# 检查 Prisma
echo "💾 检查 Prisma 状态..."
if [ -d "node_modules/@prisma/client" ]; then
  echo "  ✅ Prisma Client 已生成"
else
  echo "  ❌ Prisma Client 未生成 (运行 'npx prisma generate')"
  all_exist=false
fi

echo ""

# 最终结果
if [ "$all_exist" = true ]; then
  echo "✅ 所有检查通过！认证系统配置完成。"
  echo ""
  echo "🚀 下一步:"
  echo "  1. 启动开发服务器: npm run dev"
  echo "  2. 访问注册页面: http://localhost:3000/auth/register"
  echo "  3. 访问登录页面: http://localhost:3000/auth/login"
  echo "  4. 访问受保护页面: http://localhost:3000/articleList"
else
  echo "❌ 有一些配置缺失，请检查上面的错误信息。"
  exit 1
fi
