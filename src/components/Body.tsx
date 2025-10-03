// src/components/Body.tsx
import { useEffect, useRef } from "react";

/**
 * Body component:
 * - loads portal scripts
 * - loads recipes.js as a module (so its internal import() calls resolve)
 * - registers recipes (recipes.js can also register them itself via APIMaticDevPortal.ready)
 * - injects access token when available
 */
export default function Body({ accessToken }: { accessToken?: string }) {
  const widgetId = "apimatic-widget";
  const portalRef = useRef<any>(null);

  useEffect(() => {
    const externalJs = "https://dxjs.apimatic.io/v7/static/js/portal.v7.js";
    const localJs = "/static/js/portal.js";
    const recipeBundleModule = "/static/scripts/recipes/recipes.js"; // <- this must remain a module file in /public
    const localCss = "/static/css/portal.css";

    // Ensure CSS injected once
    if (!document.querySelector(`link[href="${localCss}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = localCss;
      document.head.appendChild(link);
      console.log("[Body] Appended CSS:", localCss);
    }

    // Helper: append classic script tag
    const loadClassicScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = false;
        s.defer = true;
        s.onload = () => {
          console.log(`[Body] Classic script loaded: ${src}`);
          resolve();
        };
        s.onerror = (e) => {
          console.error(`[Body] Classic script failed: ${src}`, e);
          reject(e);
        };
        document.body.appendChild(s);
        console.log(`[Body] Appended classic script: ${src}`);
      });

    // Helper: append module script tag (for recipes bundle that uses import())
    const loadModuleScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.type = "module"; // <-- important: makes import() inside recipes.js resolve relative to this file
        s.onload = () => {
          console.log(`[Body] Module script loaded: ${src}`);
          resolve();
        };
        s.onerror = (e) => {
          console.error(`[Body] Module script failed: ${src}`, e);
          reject(e);
        };
        document.body.appendChild(s);
        console.log(`[Body] Appended module script: ${src}`);
      });

    // Main async loader
    (async () => {
      try {
        // 1) Load portal core scripts (classic)
        await loadClassicScript(externalJs);
        await loadClassicScript(localJs);

        // 2) Load recipes bundle as a module so that its dynamic imports resolve relative to it
        try {
          await loadModuleScript(recipeBundleModule);
        } catch (err) {
          console.warn("[Body] recipes module failed to load. You can still register workflows manually.", err);
        }

        // 3) Wait for portal ready and keep portal ref
        (window as any).APIMaticDevPortal?.ready(async (portal: any) => {
          try {
            console.log("[Body] APIMaticDevPortal ready. Portal methods:", Object.keys(portal || {}));
            portalRef.current = portal;

            // Optionally: if recipes.js didn't self-register, attempt to register common globals
            // (recipes.js may have exported flows to window, e.g. window.AccountDetailsFlow)
            const tryRegisterFromWindow = () => {
              const known = [
                { key: "AccountDetailsFlow", permalink: "page:recipes/AccountDetailsFlow", name: "Account Details Flow" },
                { key: "AccountVerificationFlow", permalink: "page:recipes/AccountVerificationFlow", name: "Account Verification Flow" },
                { key: "PfmAccountAggregationFlow", permalink: "page:recipes/PfmAccountAggregationFlow", name: "PFM Account Aggregation Flow" },
              ];
              for (const r of known) {
                const fn = (window as any)[r.key];
                if (typeof fn === "function") {
                  try {
                    portal.registerWorkflow(r.permalink, r.name, fn);
                    console.log(`[Body] Registered workflow from window global: ${r.name}`);
                  } catch (err) {
                    console.warn(`[Body] portal.registerWorkflow failed for ${r.name}`, err);
                  }
                } else {
                  console.log(`[Body] window.${r.key} not present (skipping)`);
                }
              }
            };

            // Run one attempt to auto-register window-exposed recipes
            tryRegisterFromWindow();

            // If access token already available at ready time, inject it
            if (accessToken) {
              try {
                await portal.setConfig((defaultConfig: any) => ({
                  ...defaultConfig,
                  auth: {
                    ...defaultConfig.auth,
                    bearerAuth: {
                      ...defaultConfig.auth?.bearerAuth,
                      AccessToken: `Bearer ${accessToken}`,
                    },
                  },
                }));
                console.log("[Body] Injected access token on ready.");
              } catch (err) {
                console.error("[Body] Failed injecting token on ready:", err);
              }
            }
          } catch (err) {
            console.error("[Body] Error in portal.ready callback:", err);
          }
        });
      } catch (err) {
        console.error("[Body] Error loading scripts:", err);
      }
    })();

    return () => {
      portalRef.current = null;
    };
  }, []); // run once

  // Whenever accessToken changes, inject into portal if ready
  useEffect(() => {
    if (!accessToken) return;
    const inject = async () => {
      const portal = portalRef.current;
      if (!portal) {
        console.warn("[Body] portal not ready yet when injecting token. Will attempt via APIMaticDevPortal.ready...");
        const ap = (window as any).APIMaticDevPortal;
        if (ap && typeof ap.ready === "function") {
          ap.ready(async (p: any) => {
            try {
              if (p && typeof p.setConfig === "function") {
                await p.setConfig((defaultConfig: any) => ({
                  ...defaultConfig,
                  auth: {
                    ...defaultConfig.auth,
                    bearerAuth: {
                      ...defaultConfig.auth?.bearerAuth,
                      AccessToken: `Bearer ${accessToken}`,
                    },
                  },
                }));
                console.log("[Body] Token injected via ap.ready");
              }
            } catch (err) {
              console.error("[Body] Failed injecting token via ap.ready:", err);
            }
          });
        }
        return;
      }

      try {
        if (typeof portal.setConfig === "function") {
          await portal.setConfig((defaultConfig: any) => ({
            ...defaultConfig,
            auth: {
              ...defaultConfig.auth,
              bearerAuth: {
                ...defaultConfig.auth?.bearerAuth,
                AccessToken: `Bearer ${accessToken}`,
              },
            },
          }));
          console.log("[Body] Token injected via portalRef.setConfig");
        } else {
          console.warn("[Body] portal.setConfig not available on portalRef");
        }
      } catch (err) {
        console.error("[Body] Failed to inject token into portalRef:", err);
      }
    };

    inject();
  }, [accessToken]);

  return (
    <div
      id={widgetId}
      style={{
        width: "100%",
        height: "calc(100vh - 64px)",
      }}
    />
  );
}
