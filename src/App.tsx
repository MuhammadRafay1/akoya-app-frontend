// akoya-react-sample-app/src/App.tsx
// -------------------------------
// Updated: Automatically parse authorization `code` from the redirect URL and
// perform the token exchange using a Basic `Authorization` header (username:password
// base64). The returned `id_token` (if present) is copied to clipboard and shown
// in a small popup window.
//
// SECURITY: This file includes plaintext credentials for demo/sandbox only. Do NOT
// store real credentials or secrets in frontend code in production.

import React, { useState, useRef } from "react";
import type { JSX } from "react/jsx-runtime";

// ------------------
// CONFIG (update before running)
// ------------------
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID; // if needed by auth URL
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI; // must be registered

// Akoya sandbox endpoints - confirm & replace with the exact URLs for your Akoya account
const AUTH_ENDPOINT = "https://sandbox-idp.ddp.akoya.com/auth";
const TOKEN_ENDPOINT = "https://sandbox-idp.ddp.akoya.com/token";

// Credentials used for the Basic Authorization header on the token endpoint.
// Provided here only for local sandbox testing. For production, exchange on a
// backend service that keeps these credentials secret.

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// Optional: demo user credentials used as login_hint (won't auto-fill IdP fields reliably)
const DEMO_USERNAME = "test-user";
const DEMO_PASSWORD = "test-password";

function makeAuthUrl(state: string) {
  const params = new URLSearchParams({
    connector: "mikomo",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid profile offline_access",
    state,
    login_hint: DEMO_USERNAME,
    prefill_username: DEMO_USERNAME,
  });

  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

export default function App(): JSX.Element {
  const [status, setStatus] = useState<string>("idle");
  const popupRef = useRef<Window | null>(null);

  async function startAuthFlow(): Promise<void> {
    setStatus("starting");

    if (!CLIENT_ID || CLIENT_ID.startsWith("REPLACE")) {
      alert("Please set CLIENT_ID (and other CONFIG constants) in the source before running.");
      setStatus("idle");
      return;
    }

    const state = Math.random().toString(36).slice(2);
    const authUrl = makeAuthUrl(state);

    const popup = window.open(authUrl, "akoya_auth_popup", "width=600,height=800");
    if (!popup) {
      alert("Popup blocked. Please allow popups for this site.");
      setStatus("idle");
      return;
    }

    popupRef.current = popup;
    setStatus("waiting_for_user_interaction");

    const pollIntervalMs = 500;
    const maxWaitMs = 1000 * 60 * 2; // 2 minutes
    const start = Date.now();

    const poll = setInterval(async () => {
      try {
        if (!popup || popup.closed) {
          clearInterval(poll);
          setStatus("popup_closed");
          return;
        }

        // Accessing popup.location.href will throw while it's on another origin.
        const href = popup.location.href;

        if (href && href.startsWith(REDIRECT_URI)) {
          const url = new URL(href);
          const returnedState = url.searchParams.get("state");
          const code = url.searchParams.get("code");

          // basic state validation
          if (returnedState !== state) {
            console.warn("State mismatch", { expected: state, got: returnedState });
            clearInterval(poll);
            popup.close();
            setStatus("state_mismatch");
            return;
          }

          clearInterval(poll);
          popup.close();

          if (!code) {
            setStatus("no_code_returned");
            alert("No authorization code was returned in the redirect URL.");
            return;
          }

          setStatus("exchanging_code");
          try {
            const tokenResponse = await exchangeCodeForTokens(code);
            setStatus("done");

            // The token endpoint may return `id_token`, `access_token`, or both.
            const idToken = tokenResponse.id_token ?? tokenResponse.access_token ?? null;

            // Copy id_token to clipboard and show in popup
            if (idToken) {
              try {
                await navigator.clipboard.writeText(idToken);
              } catch (e) {
                // Clipboard API may be unavailable; ignore copy failure
              }

              const resultWin = window.open("", "akoya_token_result", "width=600,height=400");
              if (resultWin) {
                resultWin.document.title = "Akoya Token Result";
                resultWin.document.body.style.whiteSpace = "pre-wrap";
                resultWin.document.body.innerText = `id_token (copied to clipboard if allowed):

${idToken}`;
              } else {
                alert(`id_token:

${idToken}`);
              }
            } else {
              // No id_token found: show full response
              const resultWin = window.open("", "akoya_token_result", "width=600,height=400");
              const body = JSON.stringify(tokenResponse, null, 2);
              if (resultWin) {
                resultWin.document.title = "Akoya Token Result";
                resultWin.document.body.style.whiteSpace = "pre-wrap";
                resultWin.document.body.innerText = body;
              } else {
                alert(body);
              }
            }
          } catch (err) {
            console.error(err);
            setStatus("token_exchange_failed");
            alert("Token exchange failed: " + String(err));
          }
        }
      } catch (err) {
        // cross-origin access will fail here until redirect occurs to REDIRECT_URI
      }

      if (Date.now() - start > maxWaitMs) {
        clearInterval(poll);
        try {
          popup.close();
        } catch (e) {}
        setStatus("timeout");
      }
    }, pollIntervalMs);
  }

  async function exchangeCodeForTokens(code: string): Promise<any> {
  const resp = await fetch(`${BACKEND_URL}/exchange`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Backend exchange failed: ${resp.status} ${text}`);
  }

  return resp.json();
}


  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Akoya Auth Demo (React)</h1>
          <div>
            <button
              onClick={() => startAuthFlow()}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Run Akoya auth flow
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <p className="mb-4">Status: <strong>{status}</strong></p>
        <p className="text-sm text-gray-600">
          Notes: This demo will parse the authorization `code` from the redirect URL
          and POST it to the token endpoint with a Basic Authorization header. The
          returned `id_token` (or `access_token` if `id_token` isn't present) will
          be copied to your clipboard (if allowed) and displayed in a popup.
        </p>
      </main>
    </div>
  );
}
