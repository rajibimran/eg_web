import Layout from "@/components/layout/Layout";
import { TrustSectionDataProvider } from "@/hooks/useTrustSectionData";
import HeroSection from "@/components/home/HeroSection";
import TrustCertRibbon from "@/components/home/TrustCertRibbon";
import TrustReasonsRow from "@/components/home/TrustReasonsRow";
import ServicesSection from "@/components/home/ServicesSection";
import RegionHighlightsSection from "@/components/home/RegionHighlightsSection";
import CountryGuidelinesSection from "@/components/home/CountryGuidelinesSection";
import TrustDarkBandSection from "@/components/home/TrustDarkBandSection";
import QuickContactSection from "@/components/home/QuickContactSection";

const Index = () => {
  return (
    <Layout>
      <TrustSectionDataProvider>
        <HeroSection />
        <ServicesSection />
        <TrustReasonsRow />
        <TrustCertRibbon />
        <RegionHighlightsSection />
        <CountryGuidelinesSection />
        <TrustDarkBandSection />
        <QuickContactSection />
      </TrustSectionDataProvider>
    </Layout>
  );
};

export default Index;
