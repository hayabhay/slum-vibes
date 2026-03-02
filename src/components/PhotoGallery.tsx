import type { UnsplashImage } from '../types';

interface PhotoGalleryProps {
  images: UnsplashImage[];
}

export default function PhotoGallery({ images }: PhotoGalleryProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {images.slice(0, 6).map((image, index) => (
        <div key={index} className={`relative group overflow-hidden rounded-lg sm:block ${index >= 4 ? 'hidden' : ''}`}>
          <img
            src={image.url}
            alt={image.alt}
            loading="lazy"
            className="w-full h-40 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
