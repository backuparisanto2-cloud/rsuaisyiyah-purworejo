import mitra1 from "@/assets/mitra-1.png";
import mitra2 from "@/assets/mitra-2.png";
import mitra3 from "@/assets/mitra-3.png";
import mitra4 from "@/assets/mitra-4.png";
import logoPKU from "@/assets/logo-pku.png";

const MITRA = [
  { name: "Mitra Sehat", src: mitra1 },
  { name: "Asuransi Nusantara", src: mitra2 },
  { name: "FK Universitas", src: mitra3 },
  { name: "Kemenkes", src: mitra4 },
  { name: "PKU", src: logoPKU },
];

export default function MitraSlider() {
  const all = [...MITRA, ...MITRA];

  return (
    <section id="mitra" className="py-16 px-6 bg-white border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm font-semibold tracking-widest text-secondary uppercase">
          Mitra & Jaringan
        </p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-center text-primary">
          Didukung Oleh
        </h2>
      </div>
      <div className="mt-10 relative w-full overflow-hidden">
        <div className="flex animate-marquee w-max">
          {all.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-center mx-8 md:mx-12 shrink-0"
            >
              <img
                src={m.src}
                alt={m.name}
                loading="lazy"
                width={120}
                height={120}
                className="h-16 md:h-20 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
