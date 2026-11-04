import { useEffect, useState } from "react";
import { getCurrentAdmin, logoutAdmin } from "./features/auth/authApi.js";
import Dashboard from "./features/dashboard/Dashboard.jsx";
import Login from "./features/auth/Login.jsx";
function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    getCurrentAdmin()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCheckingSession(false));
  }, []);

  async function logout() {
    try {
      await logoutAdmin();
    } finally {
      setUser(null);
    }
  }

  if (checkingSession) return <main className="grid min-h-screen place-items-center bg-[#0b0b0c] text-sm text-[#c1a15f]">Loading your session…</main>;
  return user ? (
    <Dashboard user={user} onUserUpdated={(updatedUser) => setUser((current) => ({ ...current, ...updatedUser }))} onLogout={logout} />
  ) : (
    <Login onLogin={setUser} />
  );
}

export default App;
