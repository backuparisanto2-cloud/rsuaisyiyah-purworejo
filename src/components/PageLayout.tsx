import { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type PageLayoutProps = {
  children: ReactNode;
  pageId?: string;
  className?: string;
};

/**
 * Layout reusable untuk halaman page builder.
 * Menangani offset vertikal terhadap Header fixed (h-24 = 96px)
 * dengan jarak konsisten di setiap breakpoint.
 */
export default function PageLayout({ children, pageId, className = "" }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header pageId={pageId} />
      <main className="flex-1 pt-32 sm:pt-36 md:pt-40 lg:pt-44 pb-12">
        <div className={`max-w-4xl mx-auto px-4 ${className}`}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
