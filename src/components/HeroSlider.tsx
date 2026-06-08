import { useEffect, useRef, useState } from "react";
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
  }, []);

  const iRef = useRef(i);
  iRef.current = i;
  useEffect(() => {
    if (!settings.autoplay || slides.length <= 1) return;
    const ms = Math.max(2, Math.min(15, settings.autoplay_interval)) * 1000;
    const id = setInterval(() => {
      const next = iRef.current + 1;
      setI(settings.loop ? next % slides.length : Math.min(next, slides.length - 1));
    }, ms);
    return () => clearInterval(id);
  }, [settings.autoplay, settings.autoplay_interval, settings.loop, slides.length]);

  useEffect(() => {
    if (i >= slides.length) setI(0);
  }, [slides.length, i]);

  return (
    <div className="absolute inset-0">
      {slides.map((s, idx) => (
        <img
          key={s.id}
          src={s.image_url}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {settings.show_dots && slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
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
