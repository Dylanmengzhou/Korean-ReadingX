"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { TbStairs } from "react-icons/tb";
import { MdClose, MdCheck } from "react-icons/md";

export type DifficultyLevel =
  | "original"
  | "beginner"
  | "intermediate"
  | "advanced";

type DifficultySelectorProps = {
  difficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
};

const difficultyLabels: Record<DifficultyLevel, string> = {
  original: "原文",
  beginner: "初级",
  intermediate: "中级",
  advanced: "高级",
};

function DifficultyOptions({
  difficulty,
  onDifficultyChange,
  closeDrawer,
}: DifficultySelectorProps & { closeDrawer?: () => void }) {
  const handleSelect = (level: DifficultyLevel) => {
    onDifficultyChange(level);
    closeDrawer?.();
  };

  return (
    <div className="space-y-2 p-2">
      {(Object.keys(difficultyLabels) as DifficultyLevel[]).map((level) => (
        <button
          key={level}
          onClick={() => handleSelect(level)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
            difficulty === level
              ? "bg-amber-100 text-amber-900"
              : "hover:bg-slate-100 text-slate-700"
          }`}
        >
          <span className="font-medium">{difficultyLabels[level]}</span>
          {difficulty === level && (
            <MdCheck size={20} className="text-amber-900" />
          )}
        </button>
      ))}
    </div>
  );
}

export function DifficultySelector(props: DifficultySelectorProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
      <Drawer direction="bottom" open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="选择难度"
            className="active:bg-transparent"
          >
            <TbStairs size={20} />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="fixed bottom-0 left-0 right-0 max-h-[85vh]">
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-amber-900">选择难度</DrawerTitle>
                <DrawerClose asChild>
                  <button className="text-slate-400 hover:text-slate-600">
                    <MdClose size={24} />
                  </button>
                </DrawerClose>
              </div>
              <DrawerDescription className="sr-only">
                选择文章的阅读难度级别
              </DrawerDescription>
            </DrawerHeader>
            <DifficultyOptions
              {...props}
              closeDrawer={() => setIsOpen(false)}
            />
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
          aria-label="选择难度"
          className="active:bg-transparent"
        >
          <TbStairs size={20} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <div className="py-1">
          {(Object.keys(difficultyLabels) as DifficultyLevel[]).map((level) => (
            <DropdownMenuItem
              key={level}
              onClick={() => props.onDifficultyChange(level)}
              className={`cursor-pointer ${
                props.difficulty === level
                  ? "bg-amber-100 text-amber-900 font-medium"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span>{difficultyLabels[level]}</span>
                {props.difficulty === level && <MdCheck size={16} />}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
