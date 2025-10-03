// src/components/Body.tsx
import { useEffect, useRef } from "react";

export default function Body({ accessToken }: { accessToken?: string }) {
  const portalRef = useRef<any>(null);

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

    (async () => {
      try {
        await loadScript(externalJs);
        await loadScript(localJs);

        (window as any).APIMaticDevPortal?.ready(async (portal: any) => {
          console.log("[Portal] Ready event fired. Methods available:", Object.keys(portal));
          portalRef.current = portal;

          // If we already have a token by the time portal is ready, inject it
          if (accessToken) {
            await injectToken(accessToken, portal);
          }
        });
      } catch (err) {
        console.error("Failed to load portal scripts:", err);
      }
    })();
  }, []);

  // whenever accessToken changes, inject into portal (if ready)
  useEffect(() => {
    if (accessToken && portalRef.current) {
      injectToken(accessToken, portalRef.current);
    }
  }, [accessToken]);

  async function injectToken(token: string, portal: any) {
    try {
      await portal.setConfig((defaultConfig: any) => ({
        ...defaultConfig,
        auth: {
          ...defaultConfig.auth,
          bearerAuth: {
            ...defaultConfig.auth?.bearerAuth,
            AccessToken: `Bearer ${token}`,
          },
        },
      }));
      console.log("[Portal] Token injected:", token);
    } catch (err) {
      console.error("[Portal] Failed to inject token:", err);
    }
  }

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
