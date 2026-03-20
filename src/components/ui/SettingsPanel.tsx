import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuizStore } from "@/store/useQuizStore";
import { playUISound } from "@/utils/audio";

export const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isVoiceEnabled, toggleVoice, appTheme, setAppTheme } = useQuizStore();

  const handleToggleTheme = () => {
    playUISound("click");
    setAppTheme(appTheme === "dark" ? "light" : "dark");
  };

  const handleToggleVoice = () => {
    playUISound("click");
    toggleVoice();
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => { playUISound("hover"); setIsOpen(true); }}
        className="fixed bottom-6 right-6 w-12 h-12 bg-surface/80 backdrop-blur-md border border-border rounded-full flex items-center justify-center text-xl shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:border-primary transition-colors z-[100]"
        title="Settings"
      >
        ⚙️
      </button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-background border border-border rounded-2xl w-full max-w-sm p-6 shadow-[0_0_50px_rgba(0,240,255,0.1)] relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                ✕
              </button>
              
              <h2 className="text-xl font-black uppercase tracking-widest text-white mb-6">
                System <span className="text-primary">Settings</span>
              </h2>

              <div className="space-y-6">
                {/* Voice Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-widest text-gray-300">AI Voice & Sounds</div>
                    <div className="text-[10px] uppercase text-gray-500">Robot speech and UI effects</div>
                  </div>
                  <button 
                    onClick={handleToggleVoice}
                    className={`w-12 h-6 rounded-full relative transition-colors ${isVoiceEnabled ? 'bg-primary' : 'bg-surface border border-border'}`}
                  >
                    <motion.div 
                      className="w-4 h-4 rounded-full bg-white absolute top-1"
                      animate={{ left: isVoiceEnabled ? "26px" : "4px" }}
                    />
                  </button>
                </div>

                {/* Theme Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-widest text-gray-300">Visual Theme</div>
                    <div className="text-[10px] uppercase text-gray-500">Switch between dark/light mode</div>
                  </div>
                  <button 
                    onClick={handleToggleTheme}
                    className={`w-12 h-6 rounded-full relative transition-colors ${appTheme === 'light' ? 'bg-secondary' : 'bg-surface border border-border'}`}
                  >
                    <motion.div 
                      className="w-4 h-4 rounded-full bg-white absolute top-1 flex items-center justify-center text-[8px]"
                      animate={{ left: appTheme === 'light' ? "26px" : "4px" }}
                    >
                      {appTheme === 'light' ? '☀️' : '🌙'}
                    </motion.div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
