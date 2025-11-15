"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AudioPlayerContextType = {
  isPlayerOpen: boolean;
  openPlayer: () => void;
  closePlayer: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined
);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  const openPlayer = () => setIsPlayerOpen(true);
  const closePlayer = () => setIsPlayerOpen(false);

  return (
    <AudioPlayerContext.Provider
      value={{ isPlayerOpen, openPlayer, closePlayer }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
