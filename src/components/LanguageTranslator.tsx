"use client";
import { useEffect } from "react";

export function LanguageTranslator() {
  useEffect(() => {
    if (document.getElementById("google-translate-script")) return;

    const addScript = document.createElement("script");
    addScript.id = "google-translate-script";
    addScript.setAttribute(
      "src",
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
    );
    document.body.appendChild(addScript);

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,ta,ml",
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };
  }, []);

  return (
    <div 
      id="google_translate_element" 
      className="inline-block scale-90 origin-right translate-y-1"
    ></div>
  );
}
