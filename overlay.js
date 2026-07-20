document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  const authArea = document.getElementById("authArea");
  const overlay = document.getElementById("loginOverlay");
  const loginBtn = document.getElementById("loginBtn");
  const signInBtn = document.getElementById("signInBtn");

  function renderLoggedInHeader(name) {
    if (!authArea) return;
    const role = localStorage.getItem("userRole") || "jobseeker";
    const profilePage = role === "employer" ? "employer.html" : "profile.html";
    authArea.innerHTML = `
      <a href="${profilePage}" class="user-name">${name}</a>
      <button id="logoutBtn" class="logout-btn">Logout</button>
    `;
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await fetch(`${API_BASE}/api/auth/logout`, {
            method: "POST",
            credentials: "include"
          });
        } catch (err) {
          console.error("Logout error:", err);
        }
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        window.location.href = "/index.html";
      });
    }
    if (signInBtn) signInBtn.style.display = "none";
  }

  const userName = localStorage.getItem("userName");

  // CHANGED: overlay stays hidden on load either way — browsing is always allowed.
  if (userName) {
    renderLoggedInHeader(userName);
  } else if (signInBtn) {
    // Sign In button in header still opens the overlay directly, that's fine.
    signInBtn.addEventListener("click", () => {
      overlay?.classList.remove("hidden");
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const emailInput = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");
      const email = emailInput?.value.trim() || "";
      const password = passwordInput?.value || "";
      if (!email || !password) {
        alert("Please fill in all fields");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("userName", data.name);
          localStorage.setItem("userRole", data.role);
          if (overlay) overlay.classList.add("hidden");
          renderLoggedInHeader(data.name);

          // CHANGED: if the overlay was triggered by an interaction (not the
          // header Sign In button), resume that action instead of redirecting.
          const pendingAction = window.__pendingAuthAction;
          if (pendingAction) {
            window.__pendingAuthAction = null;
            pendingAction();
          } else {
            window.location.href = data.role === "jobseeker" ? "/jobs.html" : "/job_ads.html";
          }
        } else {
          alert(data.error || "Login failed");
        }
      } catch (err) {
        console.error("Login fetch error:", err);
        alert("Server error");
      }
    });
  }

  // NEW: exposed globally so jobs.js (or any other script) can gate an
  // interaction behind login. Returns true if the user may proceed.
  window.requireAuth = function (onSuccessAfterLogin) {
    const loggedIn = !!localStorage.getItem("userName");
    if (loggedIn) return true;
    window.__pendingAuthAction = onSuccessAfterLogin || null;
    overlay?.classList.remove("hidden");
    return false;
  };
});
