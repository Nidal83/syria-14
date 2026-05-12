import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageGalleryProps {
  images: string[];
  alt?: string;
}

const ImageGallery = ({ images, alt = '' }: ImageGalleryProps) => {
  const [activeImg, setActiveImg] = useState(0);

  const goNext = useCallback(() => {
    setActiveImg((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setActiveImg((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-xl bg-secondary text-muted-foreground">
        No images
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main image with arrows */}
      <div className="group relative overflow-hidden rounded-xl">
        <img
          src={images[activeImg]}
          alt={alt}
          className="aspect-[16/10] w-full object-cover transition-opacity duration-300"
        />

        {images.length > 1 && (
          <>
            {/* Left arrow */}
            <button
              onClick={goPrev}
              className="absolute start-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground opacity-0 shadow-lg backdrop-blur-sm transition-opacity hover:bg-card group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Right arrow */}
            <button
              onClick={goNext}
              className="absolute end-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 text-foreground opacity-0 shadow-lg backdrop-blur-sm transition-opacity hover:bg-card group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Image counter */}
            <div className="absolute bottom-3 end-3 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
              {activeImg + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === activeImg
                  ? 'border-primary'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt="" className="h-16 w-24 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;
