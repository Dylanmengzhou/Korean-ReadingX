"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TestErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">测试错误提示</h1>

        <div className="space-y-4">
          <Button
            onClick={() => {
              router.push("/auth/login?error=OAuthAccountNotLinked");
            }}
            className="w-full"
          >
            测试 OAuthAccountNotLinked 错误
          </Button>

          <Button
            onClick={() => {
              router.push("/auth/login?error=OAuthCallback");
            }}
            className="w-full"
            variant="secondary"
          >
            测试 OAuthCallback 错误
          </Button>

          <Button
            onClick={() => {
              router.push("/auth/login?error=TestError");
            }}
            className="w-full"
            variant="outline"
          >
            测试其他错误
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-sm text-gray-600">
            点击按钮会跳转到登录页并携带错误参数，检查是否显示 toast 提示。
          </p>
        </div>
      </div>
    </div>
  );
}
