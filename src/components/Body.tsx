// src/components/Body.tsx
import { useEffect, useRef } from "react";

export default function Body() {
  const extScriptRef = useRef<HTMLScriptElement | null>(null);
  const localScriptRef = useRef<HTMLScriptElement | null>(null);
  const cssLinkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    const externalJs = "https://dxjs.apimatic.io/v7/static/js/portal.v7.js";
    const localJs = "/static/js/portal.js";
    const localCss = "/static/css/portal.css";

    // inject CSS if missing
    if (!document.querySelector(`link[href="${localCss}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = localCss;
      document.head.appendChild(link);
      cssLinkRef.current = link;
      console.log("[Body] appended CSS:", localCss);
    }

    // ordered script loading
    const makeScript = (src: string) => {
      const s = document.createElement("script");
      s.src = src;
      s.defer = true;
      s.async = false;
      return s;
    };

    const ext = makeScript(externalJs);
    ext.onload = () => {
      console.log("[Body] external portal script loaded:", externalJs);
      const local = makeScript(localJs);
      local.onload = () => {
        console.log("[Body] local portal script loaded:", localJs);
        // debug: check widget children after a small delay
        setTimeout(() => {
          const w = document.getElementById("apimatic-widget");
          console.log("DEBUG: apimatic-widget children:", w?.children.length, w);
        }, 500);
      };
      local.onerror = (e) => console.error("[Body] local script error", e);
      localScriptRef.current = local;
      document.body.appendChild(local);
    };
    ext.onerror = (e) => console.error("[Body] external script error", e);

    extScriptRef.current = ext;
    document.body.appendChild(ext);

    return () => {
      try {
        extScriptRef.current?.parentNode?.removeChild(extScriptRef.current);
        localScriptRef.current?.parentNode?.removeChild(localScriptRef.current);
        cssLinkRef.current?.parentNode?.removeChild(cssLinkRef.current);
      } catch {}
    };
  }, []);

  return (
    <div className="apimatic-portal-wrapper" style={{ flex: 1, overflow: "hidden" }}>
      <div>
        <div className="portal-header">
          <div className="branding-container apimatic-background-color">
            <div className="logo">
              <a href="https://akoya.com" target="_blank" rel="noreferrer" className="apimatic-light-image">
                <img src="/static/images/logo.png" alt="logo" />
              </a>
              <a href="https://akoya.com" target="_blank" rel="noreferrer" className="apimatic-dark-image">
                <img src="/static/images/logo-dark.png" alt="logo dark" />
              </a>
              <div className="divider apimatic-border-color" />
              <p className="apimatic-text-color">Akoya's Data Access APIs</p>
            </div>
          </div>
        </div>

        <div className="hosted-api-docs" style={{ height: "calc(100vh - 64px)" }}>
          <div id="apimatic-widget" style={{ height: "100%", width: "100%" }} />
        </div>
        <div className="portal-footer" />
      </div>
    </div>
  );
}
