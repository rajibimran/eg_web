import { MessageCircle } from "lucide-react";

const WhatsAppFAB = () => {
  return (
    <a
      href="https://wa.me/880XXXXXXXXXX"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-[72px] right-[16px] z-50 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-110 hover:bg-accent/90 sm:bottom-[24px] sm:right-[24px] sm:h-[56px] sm:w-[56px] lg:bottom-[24px]"
    >
      <MessageCircle className="h-6 w-6 sm:h-[28px] sm:w-[28px]" />
    </a>
  );
};

export default WhatsAppFAB;
