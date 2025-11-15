import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Korean ReadingX <onboarding@resend.dev>", // 使用 Resend 的测试域名，你需要替换成你自己的域名
      to: [email],
      subject: "验证你的邮箱 - Korean ReadingX",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: linear-gradient(135deg, #F5EFE1 0%, #FAF7F0 100%);
                border-radius: 20px;
                padding: 40px;
                border: 2px solid #D4C5A9;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              h1 {
                color: #5D4E37;
                font-size: 28px;
                margin-bottom: 10px;
              }
              .code-container {
                background: white;
                border: 3px solid #8B7355;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
              }
              .code {
                font-size: 36px;
                font-weight: bold;
                color: #5D4E37;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .info {
                color: #8B7355;
                font-size: 14px;
                text-align: center;
                margin-top: 20px;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #8B7355;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎓 欢迎加入 Korean ReadingX</h1>
                <p style="color: #8B7355; font-size: 16px;">开启你的韩语学习之旅</p>
              </div>
              
              <div class="code-container">
                <p style="color: #5D4E37; margin-bottom: 15px; font-size: 16px;">你的验证码是：</p>
                <div class="code">${code}</div>
                <p class="info">验证码将在 10 分钟后过期</p>
              </div>
              
              <p style="color: #5D4E37; text-align: center;">
                请在注册页面输入此验证码以完成账户创建。
              </p>
              
              <div class="footer">
                <p>如果这不是你的操作，请忽略此邮件。</p>
                <p style="margin-top: 10px;">© 2025 Korean ReadingX. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("发送邮件失败:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("发送邮件异常:", error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(email: string, code: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: "Korean ReadingX <onboarding@resend.dev>",
      to: [email],
      subject: "重置密码 - Korean ReadingX",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: linear-gradient(135deg, #F5EFE1 0%, #FAF7F0 100%);
                border-radius: 20px;
                padding: 40px;
                border: 2px solid #D4C5A9;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              h1 {
                color: #5D4E37;
                font-size: 28px;
                margin-bottom: 10px;
              }
              .code-container {
                background: white;
                border: 3px solid #8B7355;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                margin: 30px 0;
              }
              .code {
                font-size: 36px;
                font-weight: bold;
                color: #5D4E37;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .info {
                color: #8B7355;
                font-size: 14px;
                text-align: center;
                margin-top: 20px;
              }
              .warning {
                background: #FFF3CD;
                border: 1px solid #FFE69C;
                border-radius: 10px;
                padding: 15px;
                margin: 20px 0;
                color: #856404;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                color: #8B7355;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 重置密码</h1>
                <p style="color: #8B7355; font-size: 16px;">Korean ReadingX 密码重置请求</p>
              </div>
              
              <div class="code-container">
                <p style="color: #5D4E37; margin-bottom: 15px; font-size: 16px;">你的验证码是：</p>
                <div class="code">${code}</div>
                <p class="info">验证码将在 10 分钟后过期</p>
              </div>
              
              <p style="color: #5D4E37; text-align: center;">
                请在密码重置页面输入此验证码以重置密码。
              </p>
              
              <div class="warning">
                <strong>⚠️ 安全提示：</strong><br>
                如果这不是你的操作，请立即忽略此邮件并考虑更改密码。
              </div>
              
              <div class="footer">
                <p>此验证码仅用于本次密码重置，请勿告诉他人。</p>
                <p style="margin-top: 10px;">© 2025 Korean ReadingX. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("发送邮件失败:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("发送邮件异常:", error);
    return { success: false, error };
  }
}

// 生成6位随机验证码
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
