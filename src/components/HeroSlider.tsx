import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLightMode } from "@/hooks/use-light-mode";
import hero1 from "@/assets/hero-1.png";
import hero2 from "@/assets/hero-2.png";
import hero3 from "@/assets/hero-3.png";
import heroDental from "@/assets/hero-dental.jpg";

type Slide = { id: string; image_url: string; cta_link: string | null };
type Settings = {
  autoplay: boolean;
  autoplay_interval: number;
  loop: boolean;
  show_dots: boolean;
  transition_effect: string;
};

const FALLBACK: Slide[] = [hero3, hero2, heroDental, hero1].map((src, i) => ({
  id: `f-${i}`,
  image_url: src,
  cta_link: null,
}));

const SWIPE_THRESHOLD = 50; // px
const DRAG_RATIO = 0.4; // visual drag follows finger at 40%

export default function HeroSlider() {
  const light = useLightMode();
  const [slides, setSlides] = useState<Slide[]>(FALLBACK);
  const [settings, setSettings] = useState<Settings>({
    autoplay: true,
    autoplay_interval: 5,
    loop: true,
    show_dots: true,
    transition_effect: "fade",
  });
  const [i, setI] = useState(0);

  // Drag / swipe state
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragCurrentX = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: sl }, { data: st }] = await Promise.all([
        supabase
          .from("hero_slides")
          .select("id,image_url,cta_link")
          .eq("is_active", true)
          .order("display_order", { ascending: true }),
        supabase.from("hero_settings").select("*").limit(1).maybeSingle(),
      ]);
      if (!alive) return;
      if (sl && sl.length > 0) setSlides(sl as Slide[]);
      if (st) setSettings(st as Settings);
    })();

    if (light) return () => { alive = false; };

    const channel = supabase
      .channel("hero_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_slides" }, () => {
        supabase
          .from("hero_slides")
          .select("id,image_url,cta_link")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .then(({ data }) => {
            if (alive && data && data.length > 0) setSlides(data as Slide[]);
          });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "hero_settings" }, (p) => {
        if (alive && p.new) setSettings(p.new as Settings);
      })
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, [light]);

  // Autoplay
  const iRef = useRef(i);
  iRef.current = i;
  useEffect(() => {
    if (!settings.autoplay || slides.length <= 1 || isPaused) return;
    const ms = Math.max(2, Math.min(15, settings.autoplay_interval)) * 1000;
    const id = setInterval(() => {
      const next = iRef.current + 1;
      setI(settings.loop ? next % slides.length : Math.min(next, slides.length - 1));
    }, ms);
    return () => clearInterval(id);
  }, [settings.autoplay, settings.autoplay_interval, settings.loop, slides.length, isPaused]);

  useEffect(() => {
    if (i >= slides.length) setI(0);
  }, [slides.length, i]);

  // Navigation helpers
  const goNext = useCallback(() => {
    setI((prev) => (settings.loop ? (prev + 1) % slides.length : Math.min(prev + 1, slides.length - 1)));
  }, [settings.loop, slides.length]);

  const goPrev = useCallback(() => {
    setI((prev) => (settings.loop ? (prev - 1 + slides.length) % slides.length : Math.max(prev - 1, 0)));
  }, [settings.loop, slides.length]);

  // Pointer start
  const onPointerDown = useCallback((clientX: number, clientY: number) => {
    dragStartX.current = clientX;
    dragStartY.current = clientY;
    dragCurrentX.current = clientX;
    isHorizontal.current = null;
    setIsDragging(true);
    setIsPaused(true);
  }, []);

  // Pointer move
  const onPointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = clientX - dragStartX.current;
    const dy = clientY - dragStartY.current;

    if (isHorizontal.current === null) {
      // Determine scroll direction on first meaningful move
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
    }

    if (isHorizontal.current === true) {
      dragCurrentX.current = clientX;
      setDragOffset(dx * DRAG_RATIO);
    }
  }, [isDragging]);

  // Pointer end
  const onPointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setIsPaused(false);

    const dx = dragCurrentX.current - dragStartX.current;
    if (isHorizontal.current === true && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) goPrev();
      else goNext();
    }
    setDragOffset(0);
    isHorizontal.current = null;
  }, [isDragging, goNext, goPrev]);

  // Touch events
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    onPointerDown(t.clientX, t.clientY);
  }, [onPointerDown]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    onPointerMove(t.clientX, t.clientY);
  }, [onPointerMove]);

  const onTouchEnd = useCallback(() => {
    onPointerUp();
  }, [onPointerUp]);

  // Mouse events
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    onPointerDown(e.clientX, e.clientY);
  }, [onPointerDown]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    onPointerMove(e.clientX, e.clientY);
  }, [onPointerMove]);

  const onMouseUp = useCallback(() => {
    onPointerUp();
  }, [onPointerUp]);

  const onMouseLeave = useCallback(() => {
    if (isDragging) onPointerUp();
  }, [isDragging, onPointerUp]);

  // Compute slide-level translate for drag visual
  const getSlideTransform = (idx: number) => {
    if (!isDragging || isHorizontal.current !== true) return "";
    const currentOffset = dragOffset;
    // For the active slide, move with finger. Others are stacked.
    // Simplified: just translate the whole stack.
    return `translateX(${currentOffset}px)`;
  };

  const showArrows = slides.length > 1;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 select-none"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{ touchAction: isDragging && isHorizontal.current === true ? "pan-y pinch-zoom" : "pan-x pan-y" }}
    >
      {/* Slides */}
      <div
        className="absolute inset-0"
        style={{
          transform: getSlideTransform(i),
          transition: isDragging ? "none" : "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {slides.map((s, idx) => (
          <img
            key={s.id}
            src={s.image_url}
            alt=""
            aria-hidden="true"
            loading={idx === 0 ? "eager" : "lazy"}
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
              idx === i ? "opacity-100" : "opacity-0"
            }`}
            draggable={false}
          />
        ))}
      </div>

      {/* Left / Right arrows (visible on hover or while dragging) */}
      {showArrows && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Slide sebelumnya"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity md:opacity-0 md:hover:opacity-100"
            style={{ opacity: isDragging ? 0.7 : undefined }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Slide berikutnya"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity md:opacity-0 md:hover:opacity-100"
            style={{ opacity: isDragging ? 0.7 : undefined }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dots */}
      {settings.show_dots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setI(idx);
              }}
              aria-label={`Slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all ${
                idx === i ? "w-8 bg-gold" : "w-2 bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}


