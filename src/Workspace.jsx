import React, { useState } from "react";
import Login from "./Login.jsx";
import App from "./main.jsx";
import { client } from "./cloud-client.mjs";
export default function Workspace() {
  const [session, setSession] = useState(null);
  async function signOut() {
    sessionStorage.removeItem("rick-os2-guest");
    await client.auth.signOut();
    setSession(null);
  }
  return session ? (
    <App session={session} onSignOut={signOut} />
  ) : (
    <Login onReady={setSession} />
  );
}
