import { type ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppFAB from "./WhatsAppFAB";
import BackToTop from "./BackToTop";
import MobileStickyBar from "./MobileStickyBar";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-[16px] focus:py-[8px] focus:font-heading focus:text-sm focus:font-semibold">
        Skip to main content
      </a>
      <Header />
      <main
        id="main-content"
        className="flex-1 pb-[calc(3.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
      >
        {children}
      </main>
      <Footer />
      <WhatsAppFAB />
      <BackToTop />
      <MobileStickyBar />
    </div>
  );
};

export default Layout;
