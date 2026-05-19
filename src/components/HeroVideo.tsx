import { useEffect, useRef, useState } from "react";
import heroVideo from "../../public/video/hero-poli.mp4.asset.json";

export default function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!ref.current || show) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [show]);

  return (
    <div ref={ref} className="absolute inset-0">
      <img
        src="/video/hero-poli-poster.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {show && (
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="/video/hero-poli-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={heroVideo.url} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
