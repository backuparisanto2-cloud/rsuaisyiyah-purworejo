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
  /** If set, click this selector before showing the step (e.g. to open a form). */
  click?: string;
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

const STORAGE_KEY = "lov-shepherd-progress";

type TourProgress = {
  stepId: string;
  completed: boolean;
  lastAt: number;
};

function getAllTourProgress(): Record<string, TourProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveTourProgress(pathname: string, partial: Partial<TourProgress>) {
  const all = getAllTourProgress();
  const existing = all[pathname];
  all[pathname] = {
    stepId: partial.stepId ?? existing?.stepId ?? "",
    completed: partial.completed ?? existing?.completed ?? false,
    lastAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function loadTourProgress(pathname: string): TourProgress | null {
  return getAllTourProgress()[pathname] ?? null;
}

function clearTourProgress(pathname: string) {
  const all = getAllTourProgress();
  delete all[pathname];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function buildTour(steps: StepDef[], navigate: NavigateFn, pathname: string) {
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
          } else {
            // Ensure target is in viewport (responsive layouts can hide it)
            try {
              (found as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
            } catch {
              // ignore
            }
            await new Promise((r) => setTimeout(r, 150));
          }
        }
      },
      buttons: [
        ...(!isFirst
          ? [{ text: "Kembali", action: () => tour.back(), secondary: true }]
          : []),
        {
          text: "Ulangi",
          action: () => {
            const first = tour.steps[0];
            if (first) tour.show(first.id, true);
          },
          secondary: true,
        },
        { text: "Lewati", action: () => tour.cancel(), secondary: true },
        {
          text: isLast ? "Selesai" : "Lanjut",
          action: () => (isLast ? tour.complete() : tour.next()),
        },
      ],

    });
  });

  // Persist active step so users can resume after refresh
  tour.on("step:show", (evt: any) => {
    const stepId = evt?.step?.id as string | undefined;
    if (stepId) saveTourProgress(pathname, { stepId, completed: false });
  });

  return tour;
}

// =====================
// Tour builders
// =====================

const globalTour: TourBuilder = () => [
  {
    title: "Selamat datang di Panel Admin",
    text:
      "Tur singkat ini mengenalkan area utama panel admin RSU Aisyiyah. Anda bisa keluar kapan saja dengan tombol Lewati atau menekan Esc. Buka tombol Tutorial di header setiap halaman untuk panduan spesifik halaman tersebut.",
    route: "/administrator",
  },
  {
    title: "Sidebar Navigasi",
    text:
      "Semua halaman admin diakses dari sini. Di layar kecil, sidebar tersembunyi dan dibuka via ikon menu di header. Daftar menu menyesuaikan role Anda — item khusus admin disembunyikan untuk Editor & Reader.",
    target: '[data-tour="sidebar"]',
    on: "right",
  },
  {
    title: "Role & Akun Anda",
    text:
      "Email dan badge role Anda tampil di bawah sidebar (Admin, Editor, atau Reader). Admin: akses penuh. Editor: ubah semua konten kecuali Tema & Pengguna. Reader: hanya melihat.",
    target: '[data-tour="sidebar"]',
    on: "right",
  },
  {
    title: "Konten Hero",
    text:
      "Hero Teks, Hero Slider, dan Pengaturan Slider mengatur bagian paling atas beranda — teks utama, logo, dan slide gambar.",
    target: '[data-tour="nav-/administrator/hero-slider"]',
    on: "right",
  },
  {
    title: "Konten Section Beranda",
    text:
      "Tentang, Jam Besuk, Layanan, Jadwal Dokter, Mitra, FAQ, dan Kontak adalah section utama beranda yang bisa Anda perbarui isinya.",
    target: '[data-tour="nav-/administrator/layanan"]',
    on: "right",
  },
  {
    title: "Berita & Instagram",
    text:
      "Tempel kode embed atau URL post Instagram untuk menampilkan berita & info terkini di beranda.",
    target: '[data-tour="nav-/administrator/instagram"]',
    on: "right",
  },
  {
    title: "Tata Letak & Halaman Custom",
    text:
      "Page Builder untuk halaman custom (/p/slug), Menu Builder untuk navigasi header, dan Urutan Section untuk menyusun ulang beranda secara drag-and-drop.",
    target: '[data-tour="nav-/administrator/pages"]',
    on: "right",
  },
  {
    title: "Tema Warna (Admin)",
    text:
      "Ubah palet warna situs secara global. Menu ini hanya muncul untuk Admin.",
    target: '[data-tour="nav-/administrator/theme"]',
    on: "right",
  },
  {
    title: "Chatbot",
    text:
      "Atur asisten chatbot situs — system prompt, model AI, dan knowledge base.",
    target: '[data-tour="nav-/administrator/chatbot"]',
    on: "right",
  },
  {
    title: "Pengguna (Admin)",
    text:
      "Admin bisa menambah, menghapus, mengubah role, dan mereset password user lain di menu Pengguna. Akun admin pertama terlindungi otomatis.",
    target: '[data-tour="nav-/administrator/users"]',
    on: "right",
  },
  {
    title: "Header & Tutorial",
    text:
      "Tombol Tutorial selalu tersedia untuk mengulang panduan halaman aktif. Logout ada di sebelahnya.",
    target: '[data-tour="header-tutorial"]',
    on: "bottom",
  },
  {
    title: "Selesai",
    text:
      "Anda siap mengelola situs. Buka halaman manapun dan tekan Tutorial untuk panduan rinci halaman tersebut.",
  },
];

const usersTour: TourBuilder = () => [
  {
    title: "Pengguna",
    text:
      "Halaman ini hanya untuk Admin. Kelola seluruh akun panel: Admin (akses penuh), Editor (ubah konten kecuali Tema & Pengguna), dan Reader (hanya lihat).",
    route: "/administrator/users",
  },
  {
    title: "Tambah Pengguna",
    text:
      "Klik Tambah Pengguna lalu isi email, password awal (≥8 karakter), nama, dan role. User langsung bisa login dengan kredensial tersebut.",
    target: '[data-tour="users-add"]',
    on: "bottom",
    route: "/administrator/users",
  },
  {
    title: "Ubah Role",
    text:
      "Pilih role dari dropdown di tiap baris untuk langsung mengubahnya. Sistem mempertahankan minimal 1 admin aktif.",
    target: '[data-tour="users-table"]',
    on: "top",
    route: "/administrator/users",
  },
  {
    title: "Reset Password & Hapus",
    text:
      "Ikon kunci mereset password user. Ikon tempat sampah menghapus akun. Akun admin pertama (berlencana perisai) dan akun Anda sendiri tidak bisa dihapus.",
    target: '[data-tour="users-table"]',
    on: "top",
    route: "/administrator/users",
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
    tab: "pages",
  },
  {
    title: "Daftar Halaman",
    text:
      "Edit (pensil), buka di tab baru, atau hapus halaman dari sini. Klik ✎ untuk membuka editor & Menu per-halaman.",
    target: '[data-tour="pages-list"]',
    on: "top",
    route: "/administrator/pages",
    tab: "pages",
  },
  {
    title: "Tab Ringkasan Beranda",
    text:
      "Selain halaman custom, ada tab Ringkasan Beranda untuk mengatur kartu/blok ringkas yang tampil di section Ringkasan beranda.",
    target: '[data-tour-tab="summary"]',
    on: "bottom",
    route: "/administrator/pages",
  },
  {
    title: "Tambah Ringkasan",
    text:
      "Klik Tambah untuk membuat item ringkasan baru — sumber bisa manual atau diambil dari halaman Page Builder.",
    target: '[data-tour="ringkasan-add"]',
    on: "bottom",
    route: "/administrator/pages",
    tab: "summary",
  },
  {
    title: "Atur & Susun Ringkasan",
    text:
      "Setiap baris bisa diatur: toggle aktif, ganti gambar cepat, edit detail, atau hapus. Seret untuk mengubah urutan tampil di beranda.",
    target: '[data-tour="ringkasan-root"]',
    on: "top",
    route: "/administrator/pages",
    tab: "summary",
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


const heroContentTour: TourBuilder = () => [
  {
    title: "Hero Teks & Logo",
    text:
      "Atur teks utama hero beranda: judul, subjudul, badge, logo, dan tombol CTA. Preview tampil di kartu bawah.",
    route: "/administrator/hero-content",
  },
  {
    title: "Simpan Perubahan",
    text: "Tekan Simpan untuk menerapkan perubahan ke beranda secara langsung.",
    target: '[data-tour="hero-content-save"]',
    on: "top",
    route: "/administrator/hero-content",
  },
];

const heroSettingsTour: TourBuilder = () => [
  {
    title: "Pengaturan Slider",
    text:
      "Atur perilaku Hero Slider: autoplay, kecepatan transisi, dan opsi tampilan lainnya.",
    route: "/administrator/hero-settings",
  },
  {
    title: "Simpan Pengaturan",
    text: "Klik Simpan agar pengaturan diterapkan ke slider beranda.",
    target: '[data-tour="hero-settings-save"]',
    on: "top",
    route: "/administrator/hero-settings",
  },
];

const tentangTour: TourBuilder = () => [
  {
    title: "Tentang Kami",
    text:
      "Edit isi section Tentang Kami beranda: judul, paragraf, gambar, dan tombol CTA.",
    route: "/administrator/tentang",
  },
  {
    title: "Simpan",
    text: "Klik Simpan untuk memperbarui section Tentang di beranda.",
    target: '[data-tour="tentang-save"]',
    on: "top",
    route: "/administrator/tentang",
  },
];

const jamBesukTour: TourBuilder = () => [
  {
    title: "Jam Besuk",
    text:
      "Kelola daftar jam besuk. Seret untuk reorder, gunakan toggle untuk menyembunyikan, atau pensil untuk edit.",
    route: "/administrator/jam-besuk",
  },
  {
    title: "Tambah Jam",
    text: "Klik Tambah untuk menambahkan slot jam besuk baru.",
    target: '[data-tour="jam-besuk-add"]',
    on: "bottom",
    route: "/administrator/jam-besuk",
  },
];

const layananTour: TourBuilder = () => [
  {
    title: "Layanan",
    text:
      "Kelola daftar layanan rumah sakit. Seret untuk reorder, toggle untuk sembunyikan, pensil untuk edit.",
    route: "/administrator/layanan",
  },
  {
    title: "Tambah Layanan",
    text: "Klik Tambah lalu isi nama, deskripsi, dan ikon layanan.",
    target: '[data-tour="layanan-add"]',
    on: "bottom",
    route: "/administrator/layanan",
  },
];

const faqTour: TourBuilder = () => [
  {
    title: "FAQ",
    text:
      "Kelola daftar Tanya-Jawab yang tampil di beranda. Reorder via drag, sembunyikan via toggle.",
    route: "/administrator/faq",
  },
  {
    title: "Tambah FAQ",
    text: "Tekan Tambah untuk membuat pasangan pertanyaan & jawaban baru.",
    target: '[data-tour="faq-add"]',
    on: "bottom",
    route: "/administrator/faq",
  },
];

const kontakTour: TourBuilder = () => [
  {
    title: "Kontak & Footer",
    text:
      "Atur alamat, telepon, WhatsApp, email, Instagram, embed peta, dan teks footer situs.",
    route: "/administrator/kontak",
  },
  {
    title: "Simpan",
    text: "Tekan Simpan untuk memperbarui informasi kontak & footer.",
    target: '[data-tour="kontak-save"]',
    on: "top",
    route: "/administrator/kontak",
  },
];

const mitraTour: TourBuilder = () => [
  {
    title: "Mitra",
    text:
      "Kelola logo mitra/asuransi yang tampil di slider mitra. Reorder via drag, sembunyikan via toggle.",
    route: "/administrator/mitra",
  },
  {
    title: "Tambah Mitra",
    text: "Klik Tambah, unggah logo, isi nama mitra, lalu Simpan.",
    target: '[data-tour="mitra-add"]',
    on: "bottom",
    route: "/administrator/mitra",
  },
];

const sectionsTour: TourBuilder = () => [
  {
    title: "Urutan Section",
    text:
      "Atur urutan tampil section beranda dengan drag-and-drop, atau nonaktifkan toggle untuk menyembunyikan section.",
    route: "/administrator/sections",
  },
  {
    title: "Daftar Section",
    text:
      "Setiap baris mewakili satu section beranda. Hero dan Footer selalu tampil dan tidak diatur di sini.",
    target: '[data-tour="sections-list"]',
    on: "top",
    route: "/administrator/sections",
  },
];

const backupTour: TourBuilder = () => [
  {
    title: "Backup Database",
    text:
      "Khusus Admin. Unduh backup lengkap (data + file storage) atau pulihkan dari file backup.",
    route: "/administrator/backup",
  },
  {
    title: "Unduh Backup",
    text:
      "Pilih format (JSON+CSV disarankan), lalu klik Unduh. File berisi seluruh data CMS dan file storage.",
    target: '[data-tour="backup-download"]',
    on: "top",
    route: "/administrator/backup",
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
  "/administrator/hero-content": heroContentTour,
  "/administrator/hero-slider": heroSliderTour,
  "/administrator/hero-settings": heroSettingsTour,
  "/administrator/tentang": tentangTour,
  "/administrator/jam-besuk": jamBesukTour,
  "/administrator/layanan": layananTour,
  "/administrator/dokter": dokterTour,
  "/administrator/mitra": mitraTour,
  "/administrator/faq": faqTour,
  "/administrator/kontak": kontakTour,
  "/administrator/instagram": instagramTour,
  "/administrator/pages": pagesTour,
  "/administrator/menu": menuTour,
  "/administrator/sections": sectionsTour,
  "/administrator/theme": themeTour,
  "/administrator/chatbot": chatbotTour,
  "/administrator/users": usersTour,
  "/administrator/backup": backupTour,
};

let activeTour: InstanceType<typeof Shepherd.Tour> | null = null;

export function startTour(pathname: string, navigate: NavigateFn = defaultNavigate, forceRestart = false) {
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
  const tour = buildTour(builder(), navigate, pathname);
  activeTour = tour;

  // Resume from saved step unless forced restart
  let resumeStepId: string | undefined;
  if (!forceRestart) {
    const progress = loadTourProgress(pathname);
    if (progress && !progress.completed && progress.stepId) {
      resumeStepId = progress.stepId;
    }
  }

  // Keep tooltip anchored to its target on viewport resize / scroll
  const reposition = () => {
    const step: any = tour.getCurrentStep();
    if (!step) return;
    try {
      if (typeof step.setupElements === "function") step.setupElements();
      else if (typeof step._updateStepTargetOnHide === "function") step._updateStepTargetOnHide();
    } catch {
      // ignore
    }
  };
  const onResize = () => reposition();
  const onScroll = () => reposition();
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true, capture: true });

  const cleanup = () => {
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll, true);
    if (activeTour === tour) activeTour = null;
  };

  tour.on("complete", () => {
    saveTourProgress(pathname, { completed: true });
    cleanup();
  });
  tour.on("cancel", () => {
    saveTourProgress(pathname, { completed: false });
    cleanup();
  });

  tour.start();

  if (resumeStepId) {
    // Defer so Shepherd finishes init before jumping
    queueMicrotask(() => {
      try {
        tour.show(resumeStepId, true);
      } catch {
        // If step no longer exists, continue from start
      }
    });
  }

  return tour;
}

/** Restart the tour for the current admin pathname (always from step 1). */
export function restartTour(pathname: string, navigate: NavigateFn = defaultNavigate) {
  clearTourProgress(pathname);
  return startTour(pathname, navigate, true);
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
