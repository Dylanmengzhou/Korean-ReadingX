"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致！");
      return;
    }

    if (!agreeTerms) {
      setError("请先同意用户协议和隐私政策！");
      return;
    }

    if (password.length < 8) {
      setError("密码至少需要8位字符");
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "注册失败，请稍后重试");
        return;
      }

      // 注册成功，跳转到登录页
      router.push("/auth/login?registered=true");
    } catch (error) {
      console.error("注册失败:", error);
      setError("注册失败，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-svh bg-[#F5EFE1] flex items-center justify-center p-4 sm:p-4">
      <div className="w-full max-w-md">
        <div className="sm:bg-white/80 sm:backdrop-blur-sm sm:rounded-3xl sm:shadow-2xl p-6 sm:p-8 sm:border-2 sm:border-[#D4C5A9]">
          {/* 标题 */}
          <div className="text-center mb-6">
            <h1
              className="text-3xl sm:text-4xl font-bold text-[#5D4E37] mb-2"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              创建账户
            </h1>
            <p
              className="text-[#8B7355] text-base sm:text-lg"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              开启你的韩语学习之旅
            </p>
          </div>

          {/* 注册表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[#5D4E37]"
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
                className="h-11 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-xl text-base"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#5D4E37]"
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
                className="h-11 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-xl text-base"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#5D4E37]"
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
                className="h-11 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-xl text-base"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[#5D4E37]"
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
                className="h-11 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-xl text-base"
              />
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 rounded border-[#D4C5A9] text-[#8B7355] focus:ring-[#8B7355] cursor-pointer mt-0.5"
              />
              <label
                htmlFor="agreeTerms"
                className="text-[#5D4E37] cursor-pointer"
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
              className="w-full h-11 bg-[#8B7355] text-white rounded-xl font-semibold text-base shadow-lg disabled:opacity-50"
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
              className="text-center text-sm text-[#8B7355] mt-4"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              已有账户?{" "}
              <a
                href="/auth/login"
                className="text-[#5D4E37] underline font-semibold"
              >
                立即登录
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
