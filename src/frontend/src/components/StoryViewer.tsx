import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Story } from "../backend.d";

interface Props {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ stories, initialIndex, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const storiesLen = stories.length;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const current = stories[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < storiesLen - 1) {
        return prev + 1;
      }
      onCloseRef.current();
      return prev;
    });
    setProgress(0);
  }, [storiesLen]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: currentIndex is intentional to restart timer
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          goNext();
          return 100;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [currentIndex, goNext]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      data-ocid="story_viewer.modal"
    >
      <div className="relative w-full max-w-[430px] h-full">
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
          {stories.map((story, i) => (
            <div
              key={story.id.toString()}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-none rounded-full"
                style={{
                  width:
                    i < currentIndex
                      ? "100%"
                      : i === currentIndex
                        ? `${progress}%`
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          data-ocid="story_viewer.close_button"
          onClick={onClose}
          className="absolute top-10 right-4 z-10 p-2 text-white"
        >
          <X size={24} />
        </button>

        <div className="absolute top-10 left-4 z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              {current.author.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <span className="text-white text-sm font-semibold">
            {current.author}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.img
            key={currentIndex}
            src={current.image.getDirectURL()}
            alt={current.author}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>

        <button
          type="button"
          className="absolute left-0 top-0 w-1/3 h-full z-20"
          onClick={goPrev}
          aria-label="Previous story"
        />
        <button
          type="button"
          className="absolute right-0 top-0 w-1/3 h-full z-20"
          onClick={goNext}
          aria-label="Next story"
        />
      </div>
    </div>
  );
}
