// src/components/Body.tsx
import { useEffect, useRef } from "react";

export default function Body() {
  const widgetId = "apimatic-widget";
  const extRef = useRef<HTMLScriptElement | null>(null);
  const localRef = useRef<HTMLScriptElement | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const externalJs = "https://dxjs.apimatic.io/v7/static/js/portal.v7.js";
    const localJs = "/static/js/portal.js";
    const localCss = "/static/css/portal.css";

    // append portal CSS once
    if (!document.querySelector(`link[href="${localCss}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = localCss;
      document.head.appendChild(link);
    }

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.defer = true;
        s.async = false;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.body.appendChild(s);
      });

    // function that applies safe fixes to ONE element that overflows
    function fixOverflowElement(el: HTMLElement) {
      try {
        // Don't touch form controls or simple icons; target larger blocks (div, pre, table, img)
        const tag = (el.tagName || "").toLowerCase();
        if (["div", "pre", "code", "table", "img", "svg", "section"].includes(tag)) {
          el.style.maxWidth = "100%";
          el.style.boxSizing = "border-box";
          el.style.overflowWrap = "anywhere";
          el.style.wordBreak = "break-word";
          // small safe min-width so flex children don't collapse to 0
          if (!el.style.minWidth) el.style.minWidth = "0";
        }
      } catch {
        // ignore
      }
    }

    // scan the container for any offenders and patch them
    function scanAndPatch() {
      const container = document.getElementById(widgetId);
      if (!container) return;
      const rw = container.clientWidth;
      const nodes = Array.from(container.querySelectorAll<HTMLElement>("*"));
      nodes.forEach((el) => {
        if (el.clientWidth === 0) return; // skip tiny elements
        if (el.scrollWidth > rw + 1 || el.clientWidth > rw + 1) {
          fixOverflowElement(el);
        }
      });
    }

    // install mutation observer to detect appended content from portal and patch
    function startObserver() {
      const container = document.getElementById(widgetId);
      if (!container) return;
      const obs = new MutationObserver(() => {
        setTimeout(() => {
          scanAndPatch();
        }, 50);
      });
      obs.observe(container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
      observerRef.current = obs;
    }

    (async () => {
      try {
        await loadScript(externalJs);
        await loadScript(localJs);

        try {
          const ap = (window as any).APIMaticDevPortal;
          if (ap && typeof ap.show === "function") {
            ap.show({ container: widgetId });
          }
        } catch {
          /* ignore */
        }

        setTimeout(() => {
          scanAndPatch();
          startObserver();
          window.dispatchEvent(new Event("resize"));
          setTimeout(() => {
            scanAndPatch();
            window.dispatchEvent(new Event("resize"));
          }, 800);
        }, 200);
      } catch (err) {
        console.error("Failed to load portal scripts:", err);
      }
    })();

    return () => {
      observerRef.current?.disconnect();
      try {
        extRef.current?.remove();
        localRef.current?.remove();
      } catch {}
    };
  }, []);

  return (
    <div
      id="apimatic-widget"
      style={{
        width: "100%",
        height: "calc(100vh - 64px)",
      }}
    />
  );
}
