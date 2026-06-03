import { useEffect } from "react";
import { useStrapiLayout } from "@/contexts/StrapiLayoutContext";

function injectScriptTags(html: string): void {
  const container = document.createElement("div");
  container.innerHTML = html.trim();
  const scripts = container.querySelectorAll("script");

  scripts.forEach((oldScript) => {
    const id = oldScript.getAttribute("id");
    if (id && document.getElementById(id)) return;

    const src = oldScript.getAttribute("src");
    if (src && document.querySelector(`script[src="${CSS.escape(src)}"]`)) return;

    const script = document.createElement("script");
    for (const attr of oldScript.attributes) {
      script.setAttribute(attr.name, attr.value);
    }
    if (!src && oldScript.textContent) {
      script.textContent = oldScript.textContent;
    }
    document.head.appendChild(script);
  });
}

/** Injects CMS-provided chat widget scripts (e.g. Support Board) once per page load. */
const ChatbotScript = () => {
  const { siteConfig } = useStrapiLayout();
  const chatbotScript = siteConfig.chatbotScript?.trim() ?? "";

  useEffect(() => {
    if (!chatbotScript) return;
    injectScriptTags(chatbotScript);
  }, [chatbotScript]);

  return null;
};

export default ChatbotScript;
