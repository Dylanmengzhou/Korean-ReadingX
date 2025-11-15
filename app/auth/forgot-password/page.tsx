"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COUNTDOWN = 60; // seconds

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!countdown) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("请输入邮箱地址");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("邮箱格式不正确");
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await fetch("/api/auth/send-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "发送验证码失败");
        return;
      }

      toast.success("验证码已发送到您的邮箱，请查收！");
      setCountdown(RESEND_COUNTDOWN);
    } catch (error) {
      console.error("发送验证码错误:", error);
      toast.error("发送验证码失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast.error("请输入邮箱地址");
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      toast.error("邮箱格式不正确");
      return;
    }

    if (!code) {
      toast.error("请输入验证码");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      toast.error("验证码必须为 6 位数字");
      return;
    }

    if (!password || !confirmPassword) {
      toast.error("请输入新密码");
      return;
    }

    if (password.length < 8) {
      toast.error("密码长度至少为 8 位");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致");
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          code,
          password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "重置密码失败");
        return;
      }

      toast.success("密码重置成功！正在跳转到登录页...");
      setTimeout(() => router.push("/auth/login"), 1500);
    } catch (error) {
      console.error("重置密码错误:", error);
      toast.error("重置密码失败，请稍后重试");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-svh bg-[#F5EFE1] flex items-center justify-center p-3 sm:p-6 py-8">
      <div className="w-full max-w-md">
        <div className="sm:bg-white/80 sm:backdrop-blur-sm sm:rounded-2xl sm:shadow-xl p-4 sm:p-6 sm:border-2 sm:border-[#D4C5A9]">
          {/* 标题 */}
          <div className="text-center mb-4 sm:mb-5">
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#5D4E37] mb-1"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              重置密码
            </h1>
            <p
              className="text-[#8B7355] text-sm sm:text-base"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              输入邮箱和验证码以重置密码
            </p>
          </div>

          {/* 重置密码表单 */}
          <form
            onSubmit={handleResetPassword}
            className="space-y-3 sm:space-y-3.5"
          >
            {/* 邮箱 */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-medium text-[#5D4E37]"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                邮箱地址
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isResetting}
                className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base"
              />
            </div>

            {/* 验证码 */}
            <div className="space-y-1.5">
              <label
                htmlFor="code"
                className="block text-xs sm:text-sm font-medium text-[#5D4E37]"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                验证码
              </label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  type="text"
                  placeholder="请输入 6 位验证码"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  maxLength={6}
                  required
                  disabled={isResetting}
                  className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base"
                />
                <Button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || countdown > 0 || isResetting}
                  className="h-9 sm:h-10 px-3 sm:px-4 bg-[#8B7355] text-white rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap disabled:opacity-50"
                  style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
                >
                  {countdown > 0
                    ? `${countdown}秒`
                    : isSendingCode
                    ? "发送中..."
                    : "发送验证码"}
                </Button>
              </div>
            </div>

            {/* 新密码 */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-medium text-[#5D4E37]"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                新密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="至少 8 位字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isResetting}
                className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base"
              />
            </div>

            {/* 确认密码 */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs sm:text-sm font-medium text-[#5D4E37]"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                确认新密码
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isResetting}
                className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base"
              />
            </div>

            {/* 提交按钮 */}
            <Button
              type="submit"
              disabled={isResetting}
              className="w-full h-9 sm:h-10 bg-[#8B7355] text-white rounded-lg font-semibold text-sm sm:text-base shadow-lg disabled:opacity-50"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              {isResetting ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  重置中...
                </span>
              ) : (
                "重置密码"
              )}
            </Button>

            {/* 返回登录 */}
            <p
              className="text-center text-xs sm:text-sm text-[#8B7355] mt-3"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              想起密码了？{" "}
              <Link
                href="/auth/login"
                className="text-[#5D4E37] underline font-semibold"
              >
                返回登录
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
