import { useEffect, useState } from "react";
import { auth, googleProvider } from "./firebase";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

function GoogleLogin() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();

      console.log("Logged in user:", result.user);
      console.log("Firebase ID Token:", token);
    } catch (err) {
      console.error("Google login failed:", err);
      alert(err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // 🔍 Check auth state on page load
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <h2>Loading...</h2>;

  return (
    <div style={{ padding: 40 }}>
      <h1>Salon Management System</h1>

      {!user ? (
        <button onClick={loginWithGoogle}>
          Login with Google
        </button>
      ) : (
        <>
          <p>✅ Logged in as:</p>
          <p><b>{user.displayName}</b></p>
          <p>{user.email}</p>

          <button onClick={logout}>Logout</button>
        </>
      )}
    </div>
  );
}

export default GoogleLogin;
