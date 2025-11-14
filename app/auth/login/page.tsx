"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("邮箱或密码错误");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error("登录失败:", error);
      setError("登录失败,请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google 登录");
    // 这里添加 Google 登录逻辑
    // signIn("google", { callbackUrl });
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
              欢迎回来
            </h1>
            <p
              className="text-[#8B7355] text-base sm:text-lg"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              继续你的韩语学习之旅
            </p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 bg-[#FEFDFB] border-2 border-[#D4C5A9] focus:border-[#8B7355] focus:ring-[#8B7355] rounded-xl text-base"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D4C5A9] text-[#8B7355] focus:ring-[#8B7355] cursor-pointer"
                />
                <span
                  className="text-[#5D4E37]"
                  style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
                >
                  记住我
                </span>
              </label>
              <a
                href="/auth/forgot-password"
                className="text-[#8B7355] underline font-medium"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                忘记密码?
              </a>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

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
                  登录中...
                </span>
              ) : (
                "登录"
              )}
            </Button>

            {/* 分隔线 */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 border-t border-[#D4C5A9]"></div>
              <span
                className="text-[#8B7355] text-sm px-2"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                或
              </span>
              <div className="flex-1 border-t border-[#D4C5A9]"></div>
            </div>

            {/* Google 登录 */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-11 bg-[#FEFDFB] border-2 border-[#D4C5A9] text-[#5D4E37] rounded-xl font-medium"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              使用 Google 登录
            </Button>

            {/* 注册链接 */}
            <p
              className="text-center text-sm text-[#8B7355] mt-4"
              style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
            >
              还没有账户?{" "}
              <a
                href="/auth/register"
                className="text-[#5D4E37] underline font-semibold"
              >
                立即注册
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
