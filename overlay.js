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
        window.location.href = "index.html";
      });
    }
    if (signInBtn) signInBtn.style.display = "none";
  }

  const userName = localStorage.getItem("userName");
  if (userName) {
    if (overlay) overlay.classList.add("hidden");
    renderLoggedInHeader(userName);
  } else {
    if (overlay) overlay.classList.remove("hidden");
    if (signInBtn) {
      signInBtn.addEventListener("click", () => {
        window.location.href = "index-jobseeker.html";
      });
    }
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
          window.location.href = data.role === "jobseeker" ? "/jobs.html" : "/job_ads.html";
        } else {
          alert(data.error || "Login failed");
        }
      } catch (err) {
        console.error("Login fetch error:", err);
        alert("Server error");
      }
    });
  }

  if (overlay && localStorage.getItem("userName")) {
    overlay.classList.add("hidden");
  }
});
