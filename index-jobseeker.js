const API_BASE = "https://hirelink-backend-qnww.onrender.com";

const registerFields = document.getElementById("jobseeker-fields");
const terms = document.querySelector(".remember-me");
const verifySection = document.getElementById("verify-section");
const loginForm = document.getElementById("login");
const registerForm = document.getElementById("register");

const tabLinks = document.querySelectorAll(".tab-link");
const createBtn = document.querySelector("[name='create-btn']");

// Tab switching
tabLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;
    loginForm.classList.remove("active");
    registerForm.classList.remove("active");
    if (tab === "login") loginForm.classList.add("active");
    else registerForm.classList.add("active");
  });
});

// ===== CREATE ACCOUNT =====
createBtn.addEventListener("click", async () => {
  const fName = document.getElementById("register-fname").value.trim();
  const lName = document.getElementById("register-lname").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();

  if (!fName || !lName || !email || !password) {
    alert("Fill in all fields!");
    return;
  }

  try {
    const role = "jobseeker";

    const res = await fetch(`${API_BASE}/api/verification/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ fName, lName, email, password, role })
    });

    const data = await res.json();
    console.log("Send code response:", data);

    if (res.ok) {
      registerFields.style.display = "none";
      terms.style.display = "none";
      createBtn.style.display = "none";
      verifySection.style.display = "block";
      document.querySelector(".code-inputs input").focus();
    } else {
      alert(data.error || "Failed to send verification code");
    }
  } catch (err) {
    console.error(err);
    alert("Server error. See console.");
  }
});

// ===== AUTO-MOVE INPUTS =====
const codeInputs = document.querySelectorAll(".code-inputs input");

codeInputs.forEach((input, index) => {
  input.addEventListener("input", (e) => {
    if (e.target.value.length === 1 && index < codeInputs.length - 1) {
      codeInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      codeInputs[index - 1].focus();
    }
  });
});

// ===== VERIFY BUTTON =====
document.querySelector(".verify-btn").addEventListener("click", async () => {
  const code = Array.from(codeInputs).map(input => input.value.trim()).join("");

  if (code.length !== 6) return alert("Enter 6-digit code");

  try {
    const res = await fetch(`${API_BASE}/api/verification/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Account created successfully!");
      window.location.href = "/jobs.html";
    } else {
      alert(`Verification failed: ${data.error || "Unknown error"}\n${data.detail || ""}`);
    }
  } catch (err) {
    console.error(err);
    alert("Network/server error. Check console.");
  }
});

// ===== RESEND CODE =====
document.getElementById("resend-code").addEventListener("click", async () => {
  try {
    const res = await fetch(`${API_BASE}/api/verification/resend-code`, {
      method: "POST",
      credentials: "include"
    });

    const data = await res.json();
    console.log("Resend response:", data);

    if (res.ok) alert("Verification code sent again!");
    else alert(data.error || "Failed to resend code");
  } catch (err) {
    console.error(err);
    alert("Server error. See console.");
  }
});

// ===== LOGIN =====
const loginBtn = document.querySelector('button[name="login-btn"]');

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Login failed");
        return;
      }

      localStorage.setItem("userName", data.name);
      localStorage.setItem("userRole", data.role);

      const overlay = document.getElementById("loginOverlay");
      if (overlay) overlay.classList.add("hidden");

      if (data.role === "jobseeker") {
        window.location.href = "/jobs.html";
      } else if (data.role === "employer") {
        window.location.href = "/people.html";
      }

    } catch (err) {
      console.error("Login error:", err);
      alert("Server error");
    }
  });
}
