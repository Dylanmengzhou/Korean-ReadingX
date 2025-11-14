"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Page() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [wiggle1, setWiggle1] = useState(false);
  const [wiggle2, setWiggle2] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const handleClick = (src: string) => {
    router.push(src);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  // 随机抖动效果
  useEffect(() => {
    const triggerWiggle = () => {
      const randomCircle = Math.random() > 0.5 ? 1 : 2;

      if (randomCircle === 1) {
        setWiggle1(true);
        setTimeout(() => setWiggle1(false), 500);
      } else {
        setWiggle2(true);
        setTimeout(() => setWiggle2(false), 500);
      }
    };

    // 初始延迟后开始随机抖动
    const initialDelay = setTimeout(() => {
      triggerWiggle();

      // 每3-8秒随机抖动一次
      const scheduleNextWiggle = () => {
        const delay = 3000 + Math.random() * 5000;
        setTimeout(() => {
          triggerWiggle();
          scheduleNextWiggle();
        }, delay);
      };

      scheduleNextWiggle();
    }, 2000);

    return () => clearTimeout(initialDelay);
  }, []);

  // 获取收藏数量
  useEffect(() => {
    const fetchFavoriteCount = async () => {
      if (!session?.user) {
        setFavoriteCount(0);
        return;
      }

      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          const favorites = Array.isArray(data) ? data : [];
          setFavoriteCount(favorites.length);
        }
      } catch (error) {
        console.error("获取收藏数量失败:", error);
        setFavoriteCount(0);
      }
    };

    fetchFavoriteCount();
  }, [session]);

  // 如果用户未登录，显示登录背景页面
  if (status === "loading") {
    return (
      <div className="h-svh bg-[#F5EFE1] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#8B7355] border-t-transparent rounded-full animate-spin" />
          <p
            className="text-[#8B7355]"
            style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
          >
            加载中...
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-svh bg-[#F5EFE1] flex flex-col items-center justify-center p-8 relative">
        {/* 标题 */}
        <h1
          className="text-6xl md:text-7xl font-bold text-center mb-20"
          style={{
            fontFamily: "WenXinXiLeTi, sans-serif",
            color: "#000000",
          }}
        >
          <span className="block md:inline">阅读</span>
          <span className="block md:inline">才是王道</span>
        </h1>

        {/* 登录按钮 - 使用墨迹圆形背景 */}
        <div
          className="relative w-30 h-30 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 animate-float"
          onClick={() => router.push("/auth/login")}
        >
          <Image
            src="/login_bg.svg"
            alt="登录"
            width={120}
            height={120}
            className="w-full h-full object-contain absolute"
          />
          <span
            className="relative z-10 text-4xl font-bold text-white"
            style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
          >
            登录
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-svh">
      <Drawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        direction="right"
      >
        <div className="absolute top-0 right-0 p-4">
          <DrawerTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage
                src={session.user.image || "https://github.com/shadcn.png"}
                alt={session.user.name || "用户"}
              />
              <AvatarFallback>
                {session.user.name?.[0]?.toUpperCase() ||
                  session.user.email?.[0]?.toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
          </DrawerTrigger>
        </div>

        <DrawerContent className="h-full w-[80%] sm:w-[400px] fixed right-0 top-0 rounded-l-[10px]">
          <div className="h-full flex flex-col p-6">
            <DrawerHeader className="p-0 mb-6">
              <DrawerTitle className="sr-only">用户菜单</DrawerTitle>
              {/* 头像区域 */}
              <div className="flex items-center justify-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={session.user.image || "https://github.com/shadcn.png"}
                    alt={session.user.name || "用户"}
                  />
                  <AvatarFallback>
                    {session.user.name?.[0]?.toUpperCase() ||
                      session.user.email?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DrawerHeader>

            {/* 菜单项 */}
            <div className="flex flex-col gap-4 mb-6">
              <DrawerClose asChild>
                <Button
                  variant="outline"
                  onClick={() => router.push("/favorites")}
                >
                  收藏夹
                </Button>
              </DrawerClose>
              <Button variant="outline">设置</Button>
              <Button variant="outline">帮助</Button>
            </div>

            {/* 退出登录按钮 - 放在最下面 */}
            <div className="mt-auto">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* 主页内容 */}
      <div className="page h-full flex items-center justify-center bg-[#F5EFE1] p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-6xl">
          {/* 标题 */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-center my-6 sm:my-8 md:my-10"
            style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
          >
            你好，
            {session.user.name || session.user.email?.split("@")[0] || "用户"}
          </h1>

          {/* 桌面端布局 - 横向排列 */}
          <div className="hidden md:flex items-center justify-center gap-8 mb-12">
            {/* 左侧圆圈 - 阅读量 */}
            <div
              className={`relative w-64 h-64 flex flex-col items-center justify-center ${
                wiggle1 ? "circle-wiggle-1" : ""
              }`}
            >
              <Image
                src="/阅读量.svg"
                alt="阅读量"
                width={256}
                height={256}
                className="w-full h-full object-contain absolute"
              />
              <div className="relative z-10 flex flex-col items-center text-white">
                <span
                  className="text-lg font-medium mb-2"
                  style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
                >
                  阅读量
                </span>
                <span className="text-3xl font-bold">{favoriteCount}</span>
              </div>
            </div>

            {/* 右侧圆圈 - 单词 */}
            <div
              className={`relative w-64 h-64 flex flex-col items-center justify-center ${
                wiggle2 ? "circle-wiggle-2" : ""
              }`}
            >
              <Image
                src="/单词.svg"
                alt="单词"
                width={256}
                height={256}
                className="w-full h-full object-contain absolute"
              />
              <div className="relative z-10 flex flex-col items-center text-white">
                <span
                  className="text-xl font-medium mb-2"
                  style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
                >
                  单词
                </span>
                <span className="text-3xl font-bold">0</span>
              </div>
            </div>
          </div>

          {/* 移动端布局 - 纵向排列 */}
          <div className="flex md:hidden flex-col items-center gap-6 sm:gap-8 mb-6">
            {/* 上方圆圈 - 阅读量 */}
            <div
              className={`relative w-36 h-36 sm:w-40 sm:h-40 flex flex-col items-center justify-center ${
                wiggle1 ? "circle-wiggle-1" : ""
              }`}
            >
              <Image
                src="/阅读量.svg"
                alt="阅读量"
                width={160}
                height={160}
                className="w-full h-full object-contain absolute"
              />
              <div className="relative z-10 flex flex-col items-center text-white">
                <span
                  className="text-base sm:text-lg font-medium mb-1"
                  style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
                >
                  阅读量
                </span>
                <span className="text-xl sm:text-2xl font-bold">
                  {favoriteCount}
                </span>
              </div>
            </div>

            {/* 开始阅读按钮 - 在两个圆圈中间 */}
            <div
              className="cursor-pointer transition-transform hover:scale-110 flex flex-col items-center gap-2"
              onClick={() => handleClick("/articleList")}
            >
              <span
                className="text-base sm:text-lg font-medium"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                开始阅读
              </span>
              <Image
                src="/开始阅读.svg"
                alt="开始阅读"
                width={100}
                height={30}
                className="w-20 sm:w-24 h-auto object-contain"
              />
            </div>

            {/* 下方圆圈 - 单词 */}
            <div
              className={`relative w-36 h-36 sm:w-40 sm:h-40 flex flex-col items-center justify-center ${
                wiggle2 ? "circle-wiggle-2" : ""
              }`}
            >
              <Image
                src="/单词.svg"
                alt="单词"
                width={160}
                height={160}
                className="w-full h-full object-contain absolute"
              />
              <div className="relative z-10 flex flex-col items-center text-white">
                <span
                  className="text-base sm:text-lg font-medium mb-1"
                  style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
                >
                  单词
                </span>
                <span className="text-xl sm:text-2xl font-bold">0</span>
              </div>
            </div>
          </div>

          {/* 桌面端开始阅读按钮 */}
          <div
            className="hidden md:flex justify-end cursor-pointer group"
            onClick={() => handleClick("/articleList")}
          >
            <div className="flex flex-col items-center gap-2 transition-transform duration-300 group-hover:scale-110">
              <span
                className="text-xl font-medium"
                style={{ fontFamily: "WenXinXiLeTi, sans-serif" }}
              >
                开始阅读
              </span>
              <Image
                src="/开始阅读.svg"
                alt="开始阅读"
                width={120}
                height={40}
                className="w-28 h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
