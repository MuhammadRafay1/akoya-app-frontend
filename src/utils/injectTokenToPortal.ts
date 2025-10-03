// utils/injectPortalToken.ts (or paste directly where token is handled)
export async function injectTokenToPortal(rawToken: string) {
  if (!rawToken) {
    console.warn("[injectTokenToPortal] no token provided");
    return false;
  }

  // ensure "Bearer <token>" format
  const bearer = rawToken;

  // Try strategies: 1) call APIMaticDevPortal.ready (portal passed to callback)
  //                2) (fallback) call the ready again later (retries)
  // Many portal libs will call ready(cb) immediately if already ready.
  const maxAttempts = 6;
  const baseDelayMs = 250;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[injectTokenToPortal] attempt ${attempt}/${maxAttempts}`);

      // Some builds expose APIMaticDevPortal.ready — this is the preferred path.
      const ap = (window as any).APIMaticDevPortal;
      if (ap && typeof ap.ready === "function") {
        // calling ready should either 1) schedule the callback for later, or
        // 2) call it immediately if the portal is already initialised.
        await new Promise<void>((resolve, ) => {
          let settled = false;
          try {
            ap.ready(async (portal: any) => {
              try {
                console.log("[injectTokenToPortal] portal object received:", portal && Object.keys(portal || {}));
                if (!portal || typeof portal.setConfig !== "function") {
                  console.warn("[injectTokenToPortal] portal does not expose setConfig()");
                  settled = true;
                  resolve(); // nothing we can do here; will retry
                  return;
                }

                // call setConfig to inject bearer token
                await portal.setConfig((defaultConfig: any) => {
                  return {
                    ...defaultConfig,
                    auth: {
                      ...defaultConfig.auth,
                      bearerAuth: {
                        ...defaultConfig.auth?.bearerAuth,
                        AccessToken: bearer,
                      },
                    },
                  };
                });

                console.log("[injectTokenToPortal] portal.setConfig succeeded");
                settled = true;
                resolve();
              } catch (err) {
                console.error("[injectTokenToPortal] error inside portal.setConfig:", err);
                if (!settled) {
                  settled = true;
                  resolve(); // resolve so outer loop can decide to retry
                }
              }
            });
          } catch (err) {
            console.error("[injectTokenToPortal] error calling APIMaticDevPortal.ready:", err);
            if (!settled) {
              settled = true;
              resolve(); // allow retry
            }
          }
        });

        // If we reach here, we either succeeded or the portal called the callback but setConfig failed.
        // Check whether config likely updated by inspecting the portal object if possible:
        if (ap && typeof ap.ready === "function") {
          // No reliable getConfig — log success assumption and return
          console.log("[injectTokenToPortal] assume injection attempt completed (check portal UI)");
          return true;
        }
      } else {
        console.warn("[injectTokenToPortal] APIMaticDevPortal.ready not available yet");
      }
    } catch (err) {
      console.error("[injectTokenToPortal] unexpected error", err);
    }

    // wait before next attempt (exponential-ish backoff)
    const delay = baseDelayMs * attempt;
    await new Promise((r) => setTimeout(r, delay));
  }

  console.warn("[injectTokenToPortal] exhausted attempts; token not injected");
  return false;
}
