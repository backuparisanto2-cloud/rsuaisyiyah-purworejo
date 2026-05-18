const WA = "https://wa.me/6289646710859?text=Halo%20RSU%20Aisyiyah%20Purworejo%2C%20saya%20ingin%20bertanya...";

export default function WhatsAppButton() {
  return (
    <a
      href={WA}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp CS RSU Aisyiyah Purworejo"
      className="fixed left-4 bottom-6 z-50 flex items-center gap-2 bg-[#25D366] text-white rounded-full pl-2 pr-4 py-2 shadow-2xl hover:scale-105 transition-transform animate-float"
    >
      <span className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-[#25D366]"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.39-1.67a11.85 11.85 0 0 0 5.65 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.45z"/></svg>
      </span>
      <span className="text-sm font-semibold pr-1 hidden sm:inline">Chat CS</span>
    </a>
  );
}
