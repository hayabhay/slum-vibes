import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { CountryCuisine } from '../types';
import { getRegionColor } from '../utils/mapHelpers';
import PhotoGallery from './PhotoGallery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface RegionModalProps {
  country: CountryCuisine;
  onClose: () => void;
}

export default function RegionModal({ country, onClose }: RegionModalProps) {
  const accentColor = getRegionColor(country.id);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative z-50 w-full max-w-4xl 2xl:max-w-5xl"
      >
        <Card className="border-border shadow-2xl">
          {/* Accent bar */}
          <div className="h-1 rounded-t-lg" style={{ backgroundColor: accentColor }} />

          {/* Header */}
          <div className="relative flex items-center justify-center px-6 pt-5 pb-4">
            <h2 className="font-mono text-2xl lg:text-3xl 2xl:text-4xl font-bold text-foreground">{country.name}</h2>
            <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-5 [&_svg]:size-auto text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6 2xl:w-7 2xl:h-7" />
            </Button>
            <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(to right, transparent, hsl(var(--border)) 25%, hsl(var(--border)) 75%, transparent)' }} />
          </div>

          <div className="overflow-y-auto max-h-[70vh] sm:max-h-[80vh]">
            <CardContent className="px-6 pt-5 pb-6 space-y-5">
              {/* Description */}
              <p className="text-base lg:text-lg 2xl:text-xl text-muted-foreground leading-relaxed">{country.description}</p>

              <Separator />


              {/* Key Ingredients */}
              <div>
                <p className="font-mono text-xs 2xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Key Ingredients
                </p>
                <div className="flex flex-wrap gap-2">
                  {country.keyIngredients.map((ingredient) => (
                    <Badge
                      key={ingredient}
                      variant="outline"
                      className="font-mono text-sm 2xl:text-base rounded-sm px-2.5 py-0.5"
                      style={{ borderColor: accentColor + '70', color: accentColor }}
                    >
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Gallery */}
              {country.images.length > 0 && (
                <>
                  <PhotoGallery images={country.images} />
                  <Separator />
                </>
              )}

              {/* Signature Dishes */}
              <div>
                <p className="font-mono text-xs 2xl:text-sm font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  Signature Dishes
                </p>
                <div className="space-y-2">
                  {country.signatureDishes.map((dish) => (
                    <Card key={dish.name} className="border-border bg-muted/40">
                      <CardContent className="px-4 py-3">
                        <p className="font-mono font-bold text-base lg:text-lg 2xl:text-xl text-foreground mb-1">{dish.name}</p>
                        <p className="text-sm lg:text-base 2xl:text-lg text-muted-foreground leading-relaxed">{dish.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Fun Fact */}
              <div
                className="rounded-md px-4 py-3 border text-sm"
                style={{ borderColor: accentColor + '50', backgroundColor: accentColor + '0D' }}
              >
                <span className="font-mono font-bold text-xs 2xl:text-sm uppercase tracking-widest" style={{ color: accentColor }}>
                  // fun fact{' '}
                </span>
                <span className="text-sm 2xl:text-base text-muted-foreground">{country.funFact}</span>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
