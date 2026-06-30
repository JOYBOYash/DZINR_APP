import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Layers } from "lucide-react";

interface DesignCarouselProps {
  imageUrls?: string[];
  fallbackUrl: string;
  title: string;
  className?: string;
}

export const DesignCarousel: React.FC<DesignCarouselProps> = ({
  imageUrls,
  fallbackUrl,
  title,
  className = "aspect-video w-full",
}) => {
  const images = imageUrls && imageUrls.length > 0 ? imageUrls : [fallbackUrl];
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  if (images.length <= 1) {
    return (
      <div className={`relative ${className} bg-black/10 overflow-hidden`}>
        <img
          src={images[0]}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDirection(1);
    setIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDirection(-1);
    setIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className={`relative ${className} bg-black/20 overflow-hidden group/carousel`}>
      {/* Slides */}
      <div className="absolute inset-0">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={index}
            src={images[index]}
            alt={`${title} - image ${index + 1}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="w-full h-full object-cover absolute inset-0"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
      </div>

      {/* Carousel Count Badge */}
      <span className="absolute top-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md text-white font-sans font-bold text-[10px] tracking-wider uppercase rounded-full border border-white/10 z-10 flex items-center gap-1 shadow-md">
        <Layers size={10} className="text-[#ff2d51]" />
        <span>{index + 1}/{images.length}</span>
      </span>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 z-10 active:scale-95 cursor-pointer hover:bg-black/80"
        aria-label="Previous image"
      >
        <ChevronLeft size={16} strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 z-10 active:scale-95 cursor-pointer hover:bg-black/80"
        aria-label="Next image"
      >
        <ChevronRight size={16} strokeWidth={2.5} />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setDirection(i > index ? 1 : -1);
              setIndex(i);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              i === index ? "w-4 bg-[#ff2d51]" : "w-1.5 bg-white/40 hover:bg-white/60"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
