"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email) {
      toast.error("请先输入邮箱地址");
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("邮箱格式不正确");
      return;
    }

    setIsSendingCode(true);

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "发送验证码失败");
        return;
      }

      toast.success("验证码已发送到您的邮箱，请查收！");
      setCodeSent(true);
      setCountdown(60); // 60秒倒计时
    } catch (error) {
      console.error("发送验证码失败:", error);
      toast.error("发送验证码失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("两次输入的密码不一致！");
      return;
    }

    if (!agreeTerms) {
      toast.error("请先同意用户协议和隐私政策！");
      return;
    }

    if (password.length < 8) {
      toast.error("密码至少需要8位字符");
      return;
    }

    if (!verificationCode) {
      toast.error("请输入验证码");
      return;
    }

    if (verificationCode.length !== 6) {
      toast.error("验证码应为6位数字");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          name: username,
          verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "注册失败，请稍后重试");
        return;
      }

      // 注册成功，跳转到登录页
      toast.success("注册成功！正在跳转...");
      setTimeout(() => {
        router.push("/auth/login?registered=true");
      }, 1000);
    } catch (error) {
      console.error("注册失败:", error);
      toast.error("注册失败，请稍后重试");
    } finally {
      setIsLoading(false);
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
              创建账户
            </h1>
            <p
              className="text-[#8B7355] text-sm sm:text-base"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              开启你的韩语学习之旅
            </p>
          </div>

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
            <div className="space-y-1.5">
              <label
                htmlFor="username"
                className="block text-xs sm:text-sm font-medium text-[#5D4E37]"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                用户名
              </label>
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base"
              />
            </div>

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
                disabled={isLoading}
                className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base"
              />
            </div>

            {/* 验证码输入框 */}
            <div className="space-y-1.5">
              <label
                htmlFor="verificationCode"
                className="block text-xs sm:text-sm font-medium text-[#5D4E37]"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                邮箱验证码
              </label>
              <div className="flex gap-1.5 sm:gap-2">
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="请输入6位验证码"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  maxLength={6}
                  disabled={isLoading}
                  className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isSendingCode || isLoading}
                  className={`h-9 sm:h-10 px-2.5 sm:px-3 rounded-lg font-medium whitespace-nowrap text-xs sm:text-sm ${
                    countdown > 0 || isSendingCode
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#8B7355] hover:bg-[#5D4E37] text-white"
                  }`}
                  style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
                >
                  {countdown > 0
                    ? `${countdown}秒`
                    : isSendingCode
                    ? "发送中"
                    : codeSent
                    ? "重发"
                    : "发送验证码"}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-medium text-[#5D4E37]"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="至少 8 位字符"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs sm:text-sm font-medium text-[#5D4E37]"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                确认密码
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                className="h-9 sm:h-10 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-lg text-sm sm:text-base"
              />
            </div>

            <div className="flex items-start gap-2 text-xs sm:text-sm">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-[#D4C5A9] text-[#8B7355] focus:ring-[#8B7355] cursor-pointer mt-0.5"
              />
              <label
                htmlFor="agreeTerms"
                className="text-[#5D4E37] cursor-pointer leading-tight"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                我同意{" "}
                <a href="#" className="text-[#8B7355] underline font-medium">
                  用户协议
                </a>{" "}
                和{" "}
                <a href="#" className="text-[#8B7355] underline font-medium">
                  隐私政策
                </a>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-9 sm:h-10 bg-[#8B7355] text-white rounded-lg font-semibold text-sm sm:text-base shadow-lg disabled:opacity-50"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              {isLoading ? (
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
                  注册中...
                </span>
              ) : (
                "注册"
              )}
            </Button>

            {/* 登录链接 */}
            <p
              className="text-center text-xs sm:text-sm text-[#8B7355] mt-3"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              已有账户?{" "}
              <Link
                href="/auth/login"
                className="text-[#5D4E37] underline font-semibold"
              >
                立即登录
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
