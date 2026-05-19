const WA = "https://wa.me/6289646710859?text=Halo%20RSU%20Aisyiyah%20Purworejo%2C%20saya%20ingin%20bertanya...";
const IG = "https://www.instagram.com/rsu_aisyiyah?igsh=MTg0NnhndWs4Ynpl";

export default function SideSocial() {
  const items = [
    {
      href: WA,
      label: "WhatsApp",
      bg: "bg-[#25D366]",
      icon: (
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
          <path d="M20.52 3.48A11.86 11.86 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.84c0 2.09.55 4.13 1.6 5.93L0 24l6.39-1.67a11.85 11.85 0 0 0 5.65 1.44h.01c6.54 0 11.84-5.3 11.84-11.84 0-3.16-1.23-6.13-3.37-8.45zM12.05 21.4h-.01a9.55 9.55 0 0 1-4.87-1.33l-.35-.21-3.79.99 1.01-3.69-.23-.38a9.55 9.55 0 0 1-1.47-5.05c0-5.27 4.29-9.56 9.57-9.56a9.5 9.5 0 0 1 6.76 2.8 9.5 9.5 0 0 1 2.8 6.77c0 5.28-4.3 9.56-9.42 9.66zm5.43-7.16c-.3-.15-1.76-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.48.71.3 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
        </svg>
      ),
    },
    {
      href: IG,
      label: "Instagram",
      bg: "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]",
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-white" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="white" stroke="none" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
      {items.map((it) => (
        <a
          key={it.label}
          href={it.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={it.label}
          className={`${it.bg} h-10 w-10 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/70 hover:scale-110 transition-transform`}
        >
          {it.icon}
        </a>
      ))}
    </div>
  );
}
