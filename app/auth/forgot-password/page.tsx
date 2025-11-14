"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // 模拟发送重置密码邮件
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundColor: "#F5EFE1",
        fontFamily: "WenXinXiLeTi, sans-serif",
      }}
    >
      <div className="w-full max-w-md">
        {/* 移动端：无边框卡片，桌面端：有边框卡片 */}
        <div className="sm:bg-white/80 sm:backdrop-blur-sm sm:border sm:border-[#D4C5A9] sm:rounded-2xl sm:shadow-lg p-8">
          {/* 标题 */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "#5D4E37" }}
            >
              忘记密码
            </h1>
            <p className="text-sm" style={{ color: "#8B7355" }}>
              {isSubmitted ? "重置链接已发送" : "输入您的邮箱以重置密码"}
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 邮箱输入 */}
              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: "#5D4E37" }}>
                  邮箱地址
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入您的邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355]"
                  style={{
                    backgroundColor: "white",
                    color: "#5D4E37",
                  }}
                />
              </div>

              {/* 发送重置链接按钮 */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base font-medium"
                style={{
                  backgroundColor: "#5D4E37",
                  color: "white",
                }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    发送中...
                  </div>
                ) : (
                  "发送重置链接"
                )}
              </Button>

              {/* 返回登录 */}
              <div className="text-center">
                <Link
                  href="/auth/login"
                  className="text-sm"
                  style={{ color: "#8B7355" }}
                >
                  返回登录
                </Link>
              </div>
            </form>
          ) : (
            /* 成功提示 */
            <div className="space-y-6">
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: "#F5EFE1",
                  border: "1px solid #D4C5A9",
                }}
              >
                <div className="mb-3">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="#5D4E37"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm mb-2" style={{ color: "#5D4E37" }}>
                  密码重置链接已发送至
                </p>
                <p
                  className="text-base font-medium mb-3"
                  style={{ color: "#5D4E37" }}
                >
                  {email}
                </p>
                <p className="text-xs" style={{ color: "#8B7355" }}>
                  请检查您的邮箱并点击链接重置密码
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-3">
                <Button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full h-11 text-base font-medium"
                  style={{
                    backgroundColor: "white",
                    color: "#5D4E37",
                    border: "1px solid #D4C5A9",
                  }}
                >
                  重新发送
                </Button>
                <Link href="/auth/login" className="block">
                  <Button
                    className="w-full h-11 text-base font-medium"
                    style={{
                      backgroundColor: "#5D4E37",
                      color: "white",
                    }}
                  >
                    返回登录
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: "#8B7355" }}>
            没有账号？{" "}
            <Link
              href="/auth/register"
              className="font-medium"
              style={{ color: "#5D4E37" }}
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
