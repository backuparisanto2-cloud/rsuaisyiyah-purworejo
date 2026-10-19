import { useState } from "react";
import video from "@/assets/aisha-avatar.mp4.asset.json";
import poster from "@/assets/aisha-avatar-poster.jpg.asset.json";

/** Looping, center-cropped Aisha video avatar with still-image fallback. */
export default function AishaAvatar({ label = "Aisha" }: { label?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <img
        src={poster.url}
        alt={label}
        className="absolute inset-0 h-full w-full object-cover object-center"
        draggable={false}
      />
    );
  }
  return (
    <video
      src={video.url}
      poster={poster.url}
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      aria-label={label}
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
    />
  );
}
