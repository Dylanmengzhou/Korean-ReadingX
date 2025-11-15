#!/usr/bin/env node

/**
 * 环境变量检查脚本
 * 用于验证 Vercel 部署时的环境变量配置
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY'
];

console.log('🔍 检查环境变量配置...\n');

let missingVars = [];
let foundVars = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    foundVars.push(varName);
    // 只显示前几个字符,保护敏感信息
    const value = process.env[varName];
    const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`✅ ${varName}: ${preview}`);
  } else {
    missingVars.push(varName);
    console.log(`❌ ${varName}: 未设置`);
  }
});

console.log('\n📊 统计:');
console.log(`- 已配置: ${foundVars.length}/${requiredEnvVars.length}`);
console.log(`- 缺失: ${missingVars.length}/${requiredEnvVars.length}`);

if (missingVars.length > 0) {
  console.log('\n⚠️  缺失的环境变量:');
  missingVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });
  console.log('\n请在 Vercel 项目设置中添加这些环境变量。');
  process.exit(1);
} else {
  console.log('\n✨ 所有环境变量已正确配置!');
  process.exit(0);
}
