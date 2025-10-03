// src/components/Body.tsx
import { useEffect, useRef } from "react";

export default function Body({ accessToken }: { accessToken?: string }) {
  const portalRef = useRef<any>(null);

  useEffect(() => {
    const externalJs = "https://dxjs.apimatic.io/v7/static/js/portal.v7.js";
    const localJs = "/static/js/portal.js";
    const recipeScript = "/static/scripts/recipes/recipes.js";
    const localCss = "/static/css/portal.css";

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
      s.onload = () => {
        console.log(`[Body] Script loaded: ${src}`);
        resolve();
      };
      s.onerror = (e) => {
        console.error(`[Body] Failed to load script: ${src}`, e);
        reject(e);
      };
      document.body.appendChild(s);
      console.log(`[Body] Appended script: ${src}`);
    });

    (async () => {
      try {
        await loadScript(externalJs);
        await loadScript(localJs);
        await loadScript(recipeScript);

        (window as any).APIMaticDevPortal?.ready(async (portal: any) => {
          console.log("[Portal] Ready event fired");
          portalRef.current = portal;

          // If token already available, inject it right away
          if (accessToken) {
            await portal.setConfig((defaultConfig: any) => ({
              ...defaultConfig,
              auth: {
                ...defaultConfig.auth,
                bearerAuth: {
                  ...defaultConfig.auth?.bearerAuth,
                  AccessToken: accessToken,
                },
              },
            }));
            console.log("[Portal] Injected initial access token");
          }
        });
      } catch (err) {
        console.error("Failed to load portal scripts:", err);
      }
    })();

    return () => {
      portalRef.current = null;
    };
  }, []); // only once on mount

  // 🔑 Watch for token changes after mount
  useEffect(() => {
    if (portalRef.current && accessToken) {
      console.log("[Portal] Updating token after auth:", accessToken);
      portalRef.current.setConfig((defaultConfig: any) => ({
        ...defaultConfig,
        auth: {
          ...defaultConfig.auth,
          bearerAuth: {
            ...defaultConfig.auth?.bearerAuth,
            AccessToken: `Bearer ${accessToken}`,
          },
        },
      }));
    }
  }, [accessToken]); // run whenever token changes

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
