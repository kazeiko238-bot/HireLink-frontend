
document.addEventListener("DOMContentLoaded", () => {
   const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  const authArea = document.getElementById("authArea");
  const overlay = document.getElementById("loginOverlay");
  const loginBtn = document.getElementById("loginBtn");
  const signInBtn = document.getElementById("signInBtn");

  // Helper to render logged-in header
  function renderLoggedInHeader(name) {
    if (!authArea) return;

    const role = localStorage.getItem("userRole") || "jobseeker"; // default role
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
})
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

  // Check if user is already logged in
  const userName = localStorage.getItem("userName");
  if (userName) {
    if (overlay) overlay.classList.add("hidden"); // hide overlay
    renderLoggedInHeader(userName);
  } else {
    if (overlay) overlay.classList.remove("hidden");

    // Optional: Sign In button redirects to index.html
    if (signInBtn) {
      signInBtn.addEventListener("click", () => {
        window.location.href = "index-jobseeker.html";
      });
    }
  }

  // Handle login overlay button
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
          // Save user info
          localStorage.setItem("userName", data.name);
          localStorage.setItem("userRole", data.role);

          // Hide overlay
          if (overlay) overlay.classList.add("hidden");

          // Render logged-in header
          renderLoggedInHeader(data.name);

          // Redirect based on role
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

  // Safety: hide overlay if user is already logged in (for after verification)
  if (overlay && localStorage.getItem("userName")) {
    overlay.classList.add("hidden");
  }
});
