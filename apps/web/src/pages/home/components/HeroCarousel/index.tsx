import React, { useEffect, useState } from 'react';
import type { IBanner } from '@/services/type';

interface IHeroCarouselProps {
  banners: IBanner[];
  loading?: boolean;
}

const AUTOPLAY_MS = 5000;

export const HeroCarousel: React.FC<IHeroCarouselProps> = ({ banners, loading }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!banners.length) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % banners.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-gray-100 animate-pulse h-[180px] sm:h-[240px]" />
    );
  }

  if (!banners.length) {
    return null;
  }

  const active = banners[activeIdx];

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white">
      <a href={active.ctaHref} className="block relative group">
        <img
          src={active.image}
          alt={active.title}
          className="w-full h-[180px] sm:h-[240px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
        <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end text-white">
          {active.badge && (
            <span className="inline-block self-start text-[11px] font-semibold bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1 mb-2">
              {active.badge}
            </span>
          )}
          <h2 className="text-xl sm:text-3xl font-bold leading-tight max-w-[80%]">
            {active.title}
          </h2>
          <p className="text-sm sm:text-base text-white/85 mt-1 max-w-[80%]">
            {active.subtitle}
          </p>
          <span className="inline-flex items-center gap-1 mt-3 text-sm font-semibold group-hover:gap-2 transition-all">
            {active.ctaLabel} <span>→</span>
          </span>
        </div>
      </a>

      <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
        {banners.map((b, i) => (
          <button
            key={b.id}
            type="button"
            aria-label={`Go to banner ${i + 1}`}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === activeIdx ? 'bg-white w-6' : 'bg-white/50 w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
