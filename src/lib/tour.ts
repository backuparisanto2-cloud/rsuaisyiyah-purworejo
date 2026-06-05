import Shepherd from "shepherd.js";
import "shepherd.js/dist/css/shepherd.css";
import { toast } from "sonner";

type StepDef = {
  id?: string;
  title: string;
  text: string;
  target?: string; // CSS selector; if omitted, centered
  on?: "top" | "bottom" | "left" | "right" | "auto";
  /** If set, navigate to this admin route before showing this step. */
  route?: string;
  /** If set, click this `[data-tour-tab="<id>"]` trigger before showing. */
  tab?: string;
};

type TourBuilder = () => StepDef[];
type NavigateFn = (to: string) => void;

function isMobile() {
  return typeof window !== "undefined" && window.innerWidth < 768;
}

async function ensureMobileSidebarOpen(): Promise<void> {
  if (!isMobile()) return;
  const open = document.querySelector('[data-tour="sidebar"]');
  if (open && (open as HTMLElement).offsetParent !== null) return;
  const trigger = document.querySelector<HTMLElement>('[data-tour="mobile-menu-trigger"]');
  trigger?.click();
  await new Promise((r) => setTimeout(r, 350));
}

async function ensureMobileSidebarClosed(): Promise<void> {
  if (!isMobile()) return;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await new Promise((r) => setTimeout(r, 200));
}

/** Poll for an element selector until found or timeout. */
async function waitForSelector(sel: string, timeout = 2500): Promise<Element | null> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const el = document.querySelector(sel);
    if (el && (el as HTMLElement).offsetParent !== null) return el;
    await new Promise((r) => setTimeout(r, 100));
  }
  return document.querySelector(sel);
}

function currentPathname() {
  return typeof window !== "undefined" ? window.location.pathname : "/";
}

function buildTour(steps: StepDef[], navigate: NavigateFn) {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      cancelIcon: { enabled: true },
      scrollTo: { behavior: "smooth", block: "center" },
      classes: "lov-shepherd",
      modalOverlayOpeningPadding: 6,
      modalOverlayOpeningRadius: 8,
    },
    exitOnEsc: true,
    keyboardNavigation: true,
  });

  steps.forEach((s, idx) => {
    const isFirst = idx === 0;
    const isLast = idx === steps.length - 1;
    const targetIsSidebar =
      s.target?.startsWith('[data-tour="sidebar') ||
      s.target?.startsWith('[data-tour="nav-');

    tour.addStep({
      id: s.id ?? `step-${idx}`,
      title: s.title,
      text: s.text,
      attachTo: s.target ? { element: s.target, on: s.on ?? "auto" } : undefined,
      beforeShowPromise: async () => {
        // 1. Navigate to step's route if different from current
        if (s.route && currentPathname() !== s.route) {
          navigate(s.route);
          // Wait for the route to mount
          await new Promise((r) => setTimeout(r, 300));
        }
        // 2. Sidebar handling on mobile
        if (targetIsSidebar) {
          await ensureMobileSidebarOpen();
        } else {
          await ensureMobileSidebarClosed();
        }
        // 3. Activate tab if specified
        if (s.tab) {
          const tab = await waitForSelector(`[data-tour-tab="${s.tab}"]`, 1500);
          (tab as HTMLElement | null)?.click();
          await new Promise((r) => setTimeout(r, 200));
        }
        // 4. Wait for target to appear (re-query each show so highlight is current)
        if (s.target) {
          const found = await waitForSelector(s.target, 2500);
          if (!found) {
            toast.info("Elemen tour belum tersedia, lanjut ke langkah berikut.");
            // Defer to next tick then advance
            queueMicrotask(() => tour.next());
          }
        }
      },
      buttons: [
        ...(!isFirst
          ? [{ text: "Kembali", action: () => tour.back(), secondary: true }]
          : []),
        { text: "Lewati", action: () => tour.cancel(), secondary: true },
        {
          text: isLast ? "Selesai" : "Lanjut",
          action: () => (isLast ? tour.complete() : tour.next()),
        },
      ],
    });
  });

  return tour;
}

// =====================
// Tour builders
// =====================

const globalTour: TourBuilder = () => [
  {
    title: "Selamat datang!",
    text:
      "Tur singkat ini mengenalkan area utama panel admin. Anda bisa keluar kapan saja dengan tombol Lewati atau menekan Esc.",
    route: "/administrator",
  },
  {
    title: "Sidebar Navigasi",
    text:
      "Semua halaman admin diakses dari sini. Di layar kecil, sidebar tersembunyi dan dibuka via ikon menu di header.",
    target: '[data-tour="sidebar"]',
    on: "right",
  },
  {
    title: "Konten Hero",
    text:
      "Hero Teks, Hero Slider, dan Pengaturan Slider mengatur bagian paling atas beranda.",
    target: '[data-tour="nav-/administrator/hero-slider"]',
    on: "right",
  },
  {
    title: "Konten Halaman",
    text:
      "Tentang, Jam Besuk, Layanan, Jadwal Dokter, Mitra, FAQ, dan Kontak adalah section konten utama beranda.",
    target: '[data-tour="nav-/administrator/layanan"]',
    on: "right",
  },
  {
    title: "Berita & Instagram",
    text:
      "Tempel kode embed atau URL post Instagram untuk menampilkan berita & info terkini.",
    target: '[data-tour="nav-/administrator/instagram"]',
    on: "right",
  },
  {
    title: "Tata Letak & Halaman",
    text:
      "Page Builder untuk halaman custom (/p/slug), Menu Builder untuk navigasi header, dan Urutan Section untuk menyusun ulang beranda.",
    target: '[data-tour="nav-/administrator/pages"]',
    on: "right",
  },
  {
    title: "Tema & Chatbot",
    text:
      "Ubah palet warna situs, atau atur asisten chatbot (system prompt + knowledge base).",
    target: '[data-tour="nav-/administrator/theme"]',
    on: "right",
  },
  {
    title: "Header Aksi",
    text:
      "Tombol Tutorial selalu tersedia untuk mengulang panduan halaman ini. Tombol Logout di sebelahnya.",
    target: '[data-tour="header-tutorial"]',
    on: "bottom",
  },
  {
    title: "Selesai",
    text:
      "Buka halaman manapun lalu klik tombol Tutorial untuk panduan spesifik halaman tersebut.",
  },
];

const menuTour: TourBuilder = () => [
  {
    title: "Menu Builder",
    text: "Atur navigasi utama header (link header beranda).",
    route: "/administrator/menu",
  },
  {
    title: "Tambah Menu Utama",
    text: "Klik untuk menambah item menu baris atas. Tombol + di tiap baris membuat submenu.",
    target: '[data-tour="menu-add"]',
    on: "bottom",
    route: "/administrator/menu",
  },
  {
    title: "Edit Cepat",
    text:
      "Ubah label & href langsung di baris. Switch hijau menentukan visibilitas item. Panah atas/bawah untuk reorder.",
    target: '[data-tour="menu-list"]',
    on: "top",
    route: "/administrator/menu",
  },
  {
    title: "Status & Simpan",
    text:
      "Perubahan auto-save ~800ms setelah berhenti mengetik. Anda juga bisa menekan tombol Simpan atau Ctrl/Cmd+S.",
    target: '[data-tour="menu-save"]',
    on: "bottom",
    route: "/administrator/menu",
  },
  {
    title: "Reset Default",
    text:
      "Hapus semua menu dan kembalikan ke set default (anchor #beranda, #tentang, dll). Tindakan tidak bisa dibatalkan.",
    target: '[data-tour="menu-reset"]',
    on: "bottom",
    route: "/administrator/menu",
  },
];

const pagesTour: TourBuilder = () => [
  {
    title: "Page Builder",
    text:
      "Buat halaman custom yang diakses lewat URL /p/slug, lengkap dengan menu navigasi sendiri per halaman.",
    route: "/administrator/pages",
  },
  {
    title: "Halaman Baru",
    text: "Buat halaman baru. Slug otomatis dipakai sebagai URL /p/slug.",
    target: '[data-tour="pages-new"]',
    on: "bottom",
    route: "/administrator/pages",
  },
  {
    title: "Daftar Halaman",
    text:
      "Edit (pensil), buka di tab baru, atau hapus halaman dari sini. Klik ✎ untuk membuka editor & Menu per-halaman.",
    target: '[data-tour="pages-list"]',
    on: "top",
    route: "/administrator/pages",
  },
];

const heroSliderTour: TourBuilder = () => [
  {
    title: "Hero Slider",
    text: "Atur slide gambar yang tampil di bagian hero beranda.",
    route: "/administrator/hero-slider",
  },
  {
    title: "Tambah Slide",
    text: "Tambah slide baru — judul, subjudul, gambar, dan link tombol.",
    target: '[data-tour="hero-add"]',
    on: "bottom",
    route: "/administrator/hero-slider",
  },
];

const instagramTour: TourBuilder = () => [
  {
    title: "Berita & Instagram",
    text:
      "Tempel kode embed Instagram (<blockquote>) atau cukup URL post (https://www.instagram.com/.../p/...) — sistem otomatis membuat embed resmi.",
    route: "/administrator/instagram",
  },
  {
    title: "Input Post",
    text: "Tempel embed/URL di sini, lalu klik tombol tambah.",
    target: '[data-tour="ig-input"]',
    on: "bottom",
    route: "/administrator/instagram",
  },
];

const dokterTour: TourBuilder = () => [
  {
    title: "Jadwal Dokter",
    text: "Kelola daftar dokter beserta jadwal praktik per dokter.",
    route: "/administrator/dokter",
  },
  {
    title: "Import AI",
    text:
      "Punya gambar jadwal? Pakai Import Multi-Dokter (AI) untuk parsing otomatis ke baris-baris jadwal.",
    target: '[data-tour="dokter-import"]',
    on: "bottom",
    route: "/administrator/dokter",
  },
  {
    title: "Tambah Dokter",
    text: "Atau tambah manual satu per satu lewat tombol Tambah Dokter.",
    target: '[data-tour="dokter-add"]',
    on: "bottom",
    route: "/administrator/dokter",
  },
];

const themeTour: TourBuilder = () => [
  {
    title: "Tema Warna",
    text: "Ubah palet warna situs (primary, background, dll).",
    route: "/administrator/theme",
  },
  {
    title: "Simpan & Reset",
    text: "Simpan menerapkan perubahan ke seluruh situs; Reset Default mengembalikan ke palet bawaan.",
    target: '[data-tour="theme-save"]',
    on: "bottom",
    route: "/administrator/theme",
  },
];

const chatbotTour: TourBuilder = () => [
  {
    title: "Chatbot",
    text: "Konfigurasi asisten chatbot situs.",
    route: "/administrator/chatbot",
  },
  {
    title: "Pengaturan",
    text:
      "Atur system prompt, model AI, dan parameter chatbot. Klik Simpan Pengaturan untuk menyimpan.",
    target: '[data-tour="chatbot-settings"]',
    on: "top",
    route: "/administrator/chatbot",
  },
  {
    title: "Knowledge Base",
    text:
      "Tambah pengetahuan manual atau Generate otomatis dari konten situs. Sync menarik ulang dari sumber.",
    target: '[data-tour="chatbot-kb"]',
    on: "top",
    route: "/administrator/chatbot",
  },
];

const genericTour: TourBuilder = () => [
  {
    title: "Halaman ini",
    text:
      "Edit konten lewat field di kartu di bawah, lalu tekan tombol Simpan. Setiap halaman menyimpan ke databasenya masing-masing.",
  },
];

// =====================
// Registry
// =====================

const REGISTRY: Record<string, TourBuilder> = {
  "/administrator": globalTour,
  "/administrator/menu": menuTour,
  "/administrator/pages": pagesTour,
  "/administrator/hero-slider": heroSliderTour,
  "/administrator/instagram": instagramTour,
  "/administrator/dokter": dokterTour,
  "/administrator/theme": themeTour,
  "/administrator/chatbot": chatbotTour,
};

let activeTour: InstanceType<typeof Shepherd.Tour> | null = null;

export function startTour(pathname: string, navigate: NavigateFn = defaultNavigate) {
  // Cancel any in-flight tour so highlight tracks the freshly chosen one
  if (activeTour) {
    try {
      activeTour.cancel();
    } catch {
      // ignore
    }
    activeTour = null;
  }
  const builder = REGISTRY[pathname] ?? genericTour;
  const tour = buildTour(builder(), navigate);
  activeTour = tour;
  tour.on("complete", () => {
    if (activeTour === tour) activeTour = null;
  });
  tour.on("cancel", () => {
    if (activeTour === tour) activeTour = null;
  });
  tour.start();
  return tour;
}

/** Re-target the active tour when the user navigates to a new admin route mid-tour. */
export function syncTourWithRoute(pathname: string, navigate: NavigateFn = defaultNavigate) {
  if (!activeTour) return;
  // If a dedicated tour exists for this route and it isn't the one running, swap in.
  const builder = REGISTRY[pathname];
  if (!builder) return;
  const currentStep = activeTour.getCurrentStep();
  const currentStepId = currentStep?.id;
  // If current step already belongs to this route (heuristic: builder includes a step with same id), do nothing.
  const stepsForRoute = builder();
  const stillRelevant = stepsForRoute.some((s, i) => (s.id ?? `step-${i}`) === currentStepId);
  if (stillRelevant) return;
  startTour(pathname, navigate);
}

function defaultNavigate(to: string) {
  if (typeof window !== "undefined") window.location.assign(to);
}

export function hasDedicatedTour(pathname: string) {
  return Boolean(REGISTRY[pathname]);
}
