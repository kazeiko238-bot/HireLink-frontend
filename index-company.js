document.addEventListener("DOMContentLoaded", () => {

const API_BASE = "https://hirelink-backend-qnww.onrender.com";

const registerFields = document.getElementById("employer-fields");
const terms = document.querySelector("#register .remember-me");
const verifySection = document.getElementById("verify-section");
const loginForm = document.getElementById("login");
const registerForm = document.getElementById("register");
const forgotForm = document.getElementById("forgot");

const tabLinks = document.querySelectorAll(".tab-link");
const createBtn = document.querySelector("[name='create-btn']");

// Show one form, hide the others
function showForm(form) {
  [loginForm, registerForm, forgotForm].forEach(f => f.classList.remove("active"));
  form.classList.add("active");
}

// Tab switching (login <-> register)
tabLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const tab = link.dataset.tab;
    showForm(tab === "login" ? loginForm : registerForm);
  });
});

// ===== CREATE ACCOUNT =====
createBtn.addEventListener("click", async () => {
  const companyName = document.getElementById("company-name").value.trim();
  const industry = document.getElementById("industry").value.trim();
  const companySize = document.getElementById("company-size").value.trim();
  const email = document.getElementById("company-email").value.trim();
  const address = document.getElementById("company-address").value.trim();
  const password = document.getElementById("company-password").value.trim();
  const confirmPassword = document.getElementById("company-confirm-password").value.trim();

  if (!companyName || !industry || !email || !address || !password || !confirmPassword) {
    alert("Fill in all fields!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  if (!document.getElementById("terms").checked) {
    alert("Please agree to the Terms of Service and Privacy Policy");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/verification/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        company_name: companyName,
        industry,
        company_size: companySize,
        email,
        address,
        password,
        role: "employer"
      })
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
      window.location.href = "/job_ads.html";
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
      headers: { "Content-Type": "application/json" },
      credentials: "include"
    });

    const data = await res.json();

    if (res.ok) alert("Verification code sent again!");
    else alert(data.error || "Failed to resend code");

  } catch (err) {
    console.error(err);
    alert("Server error. See console.");
  }
});

// ===== LOGIN BUTTON =====
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
        window.location.href = "/job_ads.html";
      }

    } catch (err) {
      console.error("Login error:", err);
      alert("Server error");
    }
  });
}

// ===== FORGOT PASSWORD =====
const forgotLink = document.getElementById("forgotPasswordLink");
const forgotStep1 = document.getElementById("forgot-step-1");
const forgotStep2 = document.getElementById("forgot-step-2");
const forgotSendBtn = document.getElementById("forgot-send-btn");
const resetBtn = document.getElementById("reset-btn");
let resetEmail = "";

// Open the reset form from the login page
forgotLink.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("forgot-email").value = document.getElementById("login-email").value.trim();
  forgotStep1.style.display = "block";
  forgotStep2.style.display = "none";
  showForm(forgotForm);
});

document.getElementById("back-to-login").addEventListener("click", (e) => {
  e.preventDefault();
  showForm(loginForm);
});

// Step 1: request a reset code
forgotSendBtn.addEventListener("click", async () => {
  const email = document.getElementById("forgot-email").value.trim();
  if (!email) return alert("Please enter your email");

  forgotSendBtn.disabled = true;
  forgotSendBtn.textContent = "Sending...";

  try {
    const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (res.ok) {
      resetEmail = email;
      forgotStep1.style.display = "none";
      forgotStep2.style.display = "block";
      alert("If that email is registered, a code has been sent.");
    } else {
      alert(data.error || "Failed to send code");
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    alert("Server error. Please try again.");
  } finally {
    forgotSendBtn.disabled = false;
    forgotSendBtn.textContent = "Send Code";
  }
});

// Step 2: submit code + new password
resetBtn.addEventListener("click", async () => {
  const code = document.getElementById("reset-code").value.trim();
  const newPassword = document.getElementById("reset-password").value;
  const confirm = document.getElementById("reset-confirm").value;

  if (code.length !== 6) return alert("Enter the 6-digit code");
  if (newPassword.length < 8) return alert("Password must be at least 8 characters");
  if (newPassword !== confirm) return alert("Passwords do not match");

  resetBtn.disabled = true;
  resetBtn.textContent = "Resetting...";

  try {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: resetEmail, code, newPassword })
    });

    const data = await res.json();

    if (res.ok) {
      alert("Password reset successfully! You can now log in.");
      document.getElementById("reset-code").value = "";
      document.getElementById("reset-password").value = "";
      document.getElementById("reset-confirm").value = "";
      document.getElementById("login-email").value = resetEmail;
      document.getElementById("login-password").value = "";
      showForm(loginForm);
    } else {
      alert(data.error || "Reset failed");
    }
  } catch (err) {
    console.error("Reset password error:", err);
    alert("Server error. Please try again.");
  } finally {
    resetBtn.disabled = false;
    resetBtn.textContent = "Reset Password";
  }
});

});
