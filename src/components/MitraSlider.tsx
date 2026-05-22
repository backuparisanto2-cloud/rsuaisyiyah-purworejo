import bpjsKes from "@/assets/mitra-bpjs-kesehatan.png";
import bpjsTK from "@/assets/mitra-bpjs-tk.png";
import admedika from "@/assets/mitra-admedika.png";
import briLife from "@/assets/mitra-bri-life.png";
import jasaRaharja from "@/assets/mitra-jasa-raharja.png";
import kaiHealth from "@/assets/mitra-kai-healthcare.png";
import pkuGombong from "@/assets/mitra-rs-pku-gombong.png";
import aghisnaSidareja from "@/assets/mitra-rsu-aghisna-sidareja.png";
import pkuKroya from "@/assets/mitra-rs-pku-kroya.png";
import pkuSumpiuh from "@/assets/mitra-rsu-pku-sumpiuh.png";

const ASURANSI = [
  { name: "BPJS Kesehatan", src: bpjsKes },
  { name: "BPJS Ketenagakerjaan", src: bpjsTK },
  { name: "Admedika", src: admedika },
  { name: "BRI Life", src: briLife },
  { name: "Jasa Raharja", src: jasaRaharja },
  { name: "KAI HealthCare", src: kaiHealth },
];

const HOLDING = [
  { name: "RS PKU Muhammadiyah Gombong", src: pkuGombong },
  { name: "RSU Aghisna Medika Sidareja", src: aghisnaSidareja },
  { name: "RS PKU Muhammadiyah Aghisna Kroya", src: pkuKroya },
  { name: "RSU PKU Muhammadiyah Sumpiuh", src: pkuSumpiuh },
];

type Mitra = { name: string; src: string };

function Marquee({ items, reverse = false }: { items: Mitra[]; reverse?: boolean }) {
  const all = [...items, ...items];
  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex animate-marquee w-max items-center"
        style={reverse ? { animationDirection: "reverse" } : undefined}
      >
        {all.map((m, i) => (
          <div
            key={i}
            className="flex items-center justify-center mx-6 md:mx-10 shrink-0"
          >
            <img
              src={m.src}
              alt={m.name}
              loading="lazy"
              width={200}
              height={120}
              className="h-16 md:h-24 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-300"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MitraSlider() {
  return (
    <section id="mitra" className="py-16 px-6 bg-white border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <p className="text-center text-sm font-semibold tracking-widest text-secondary uppercase">
          Mitra & Jaringan
        </p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-center text-primary">
          Bekerja Sama Dengan
        </h2>
      </div>

      <div className="mt-10 max-w-7xl mx-auto">
        <h3 className="text-center text-base md:text-lg font-semibold text-foreground/80 mb-6">
          Mitra Asuransi
        </h3>
      </div>
      <Marquee items={ASURANSI} />

      <div className="mt-12 max-w-7xl mx-auto">
        <h3 className="text-center text-base md:text-lg font-semibold text-foreground/80 mb-6">
          Mitra Rumah Sakit Holding
        </h3>
      </div>
      <Marquee items={HOLDING} reverse />
    </section>
  );
}
