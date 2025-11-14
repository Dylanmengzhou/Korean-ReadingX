"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MdOutlineSettings, MdClose } from "react-icons/md";

type ReadingSettingsProps = {
  fontSize: number;
  showTranslation: boolean;
  onFontSizeChange: (size: number) => void;
  onShowTranslationChange: (show: boolean) => void;
};

function SettingsContent({
  fontSize,
  showTranslation,
  onFontSizeChange,
  onShowTranslationChange,
}: ReadingSettingsProps) {
  return (
    <div className="space-y-6 p-4">
      {/* 字体大小 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-amber-900">字体大小</h3>
        <div className="flex items-center justify-center gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
            disabled={fontSize <= 12}
            className="h-12 w-12 rounded-full"
          >
            <span className="text-xl">-</span>
          </Button>
          <span className="w-20 text-center text-lg font-medium">
            {fontSize}px
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
            disabled={fontSize >= 24}
            className="h-12 w-12 rounded-full"
          >
            <span className="text-xl">+</span>
          </Button>
        </div>
      </div>

      {/* 显示翻译 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-amber-900">显示翻译</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">中文翻译</span>
          <button
            type="button"
            role="switch"
            aria-checked={showTranslation}
            onClick={() => onShowTranslationChange(!showTranslation)}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
              showTranslation ? "bg-blue-600" : "bg-slate-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                showTranslation ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReadingSettings(props: ReadingSettingsProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 移动端使用 Drawer（从下往上）
  if (isMobile) {
    return (
      <Drawer direction="bottom">
        <DrawerTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="设置"
            className="active:bg-transparent"
          >
            <MdOutlineSettings size={20} />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="fixed bottom-0 left-0 right-0 max-h-[85vh]">
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-amber-900">阅读设置</DrawerTitle>
                <DrawerClose asChild>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MdClose size={24} />
                  </button>
                </DrawerClose>
              </div>
              <DrawerDescription className="sr-only">
                调整阅读字体大小和翻译显示
              </DrawerDescription>
            </DrawerHeader>
            <SettingsContent {...props} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // 桌面端使用 DropdownMenu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="设置"
          className="active:bg-transparent"
        >
          <MdOutlineSettings size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="py-2">
          <h3 className="px-4 pb-2 text-sm font-semibold text-amber-900">
            阅读设置
          </h3>
          <SettingsContent {...props} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
