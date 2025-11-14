import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ReadingSettingsState = {
  fontSize: number;
  showTranslation: boolean;
  setFontSize: (size: number) => void;
  setShowTranslation: (show: boolean) => void;
};

export const useReadingSettingsStore = create<ReadingSettingsState>()(
  persist(
    (set) => ({
      fontSize: 16,
      showTranslation: true,
      setFontSize: (size: number) => set({ fontSize: size }),
      setShowTranslation: (show: boolean) => set({ showTranslation: show }),
    }),
    {
      name: "reading-settings-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
