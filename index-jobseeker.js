
const API_BASE = "https://hirelink-backend-qnww.onrender.com";

const loginPanel = document.getElementById("loginPanel");
const forgotPanel = document.getElementById("forgotPanel");
const resetPanel = document.getElementById("resetPanel");
const globalMessage = document.getElementById("globalMessage");

const loginForm = document.getElementById("loginForm");
const forgotForm = document.getElementById("forgotForm");
const resetForm = document.getElementById("resetForm");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const forgotEmail = document.getElementById("forgotEmail");
const resetEmail = document.getElementById("resetEmail");
const verificationCode = document.getElementById("verificationCode");
const newPassword = document.getElementById("newPassword");
const confirmPassword = document.getElementById("confirmPassword");

const loginButton = document.getElementById("loginButton");
const sendCodeButton = document.getElementById("sendCodeButton");
const resetPasswordButton = document.getElementById("resetPasswordButton");
const resendCodeButton = document.getElementById("resendCodeButton");

// Keep the email used for the current password-reset flow.
let passwordResetEmail = "";

// ================= MESSAGES =================
function showMessage(message, type = "info") {
    globalMessage.textContent = message;
    globalMessage.className = `message show ${type}`;
}

function clearMessage() {
    globalMessage.textContent = "";
    globalMessage.className = "message";
}

// ================= API RESPONSE HANDLER =================
async function readApiResponse(response) {
    const text = await response.text();

    let data;

    try {
        data = text ? JSON.parse(text) : {};
    } catch (error) {
        console.error(
            "Expected JSON but received a non-JSON response.",
            {
                url: response.url,
                status: response.status,
                response: text.slice(0, 300)
            }
        );

        throw new Error(
            response.status === 404
                ? "API endpoint not found. Check your backend route and deployment."
                : "The server returned an unexpected response. Check the backend logs."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.error ||
            data.message ||
            `Request failed (${response.status}).`
        );
    }

    return data;
}

// ================= PANEL NAVIGATION =================
function showPanel(panel) {
    loginPanel.hidden = panel !== "login";
    forgotPanel.hidden = panel !== "forgot";
    resetPanel.hidden = panel !== "reset";

    clearMessage();
}

document.getElementById("openForgotPassword").addEventListener("click", () => {
    // Carry the email over if the user already entered it.
    forgotEmail.value = loginEmail.value.trim();
    showPanel("forgot");
});

document.getElementById("backToLoginFromForgot").addEventListener("click", () => {
    showPanel("login");
});

document.getElementById("backToForgot").addEventListener("click", () => {
    forgotEmail.value = passwordResetEmail;
    showPanel("forgot");
});

// ================= SHOW / HIDE PASSWORD =================
document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
        const target = document.getElementById(button.dataset.target);

        if (!target) return;

        const isPassword = target.type === "password";

        target.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Hide" : "Show";
        button.setAttribute(
            "aria-label",
            isPassword ? "Hide password" : "Show password"
        );
    });
});

// ================= LOGIN =================
loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    if (!email || !password) {
        showMessage("Please enter your email and password.", "error");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    try {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });

        const data = await readApiResponse(response);

        showMessage("Login successful. Redirecting...", "success");

        // Keep the existing role-based navigation behavior.
        if (data.role === "jobseeker") {
            window.location.href = "jobseeker.html";
        } else if (data.role === "employer") {
            window.location.href = "employer.html";
        } else {
            showMessage("Login succeeded, but the account role is unrecognized.", "error");
        }

    } catch (error) {
        console.error("Login error:", error);
        showMessage(error.message || "Unable to sign in.", "error");

    } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In";
    }
});

// ================= SEND RESET CODE =================
forgotForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    const email = forgotEmail.value.trim().toLowerCase();

    if (!email) {
        showMessage("Please enter your registered email address.", "error");
        return;
    }

    sendCodeButton.disabled = true;
    sendCodeButton.textContent = "Sending code...";

    try {
        const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email })
        });

        const data = await readApiResponse(response);

        passwordResetEmail = email;
        resetEmail.value = email;
        verificationCode.value = "";
        newPassword.value = "";
        confirmPassword.value = "";

        showPanel("reset");

        showMessage(
            data.message ||
            "If this email is registered, a verification code will be sent.",
            "success"
        );

    } catch (error) {
        console.error("Forgot password error:", error);
        showMessage(error.message || "Unable to send the verification code.", "error");

    } finally {
        sendCodeButton.disabled = false;
        sendCodeButton.textContent = "Send Verification Code";
    }
});

// ================= RESET PASSWORD =================
resetForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearMessage();

    const email = resetEmail.value.trim().toLowerCase();
    const code = verificationCode.value.trim();
    const password = newPassword.value;
    const confirmation = confirmPassword.value;

    if (!/^\d{6}$/.test(code)) {
        showMessage("Enter the 6-digit verification code.", "error");
        return;
    }

    if (password.length < 8) {
        showMessage("Your new password must be at least 8 characters long.", "error");
        return;
    }

    if (password.length > 128) {
        showMessage("Your password must not exceed 128 characters.", "error");
        return;
    }

    if (password !== confirmation) {
        showMessage("The new passwords do not match.", "error");
        return;
    }

    resetPasswordButton.disabled = true;
    resetPasswordButton.textContent = "Resetting password...";

    try {
        const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                email,
                code,
                newPassword: password
            })
        });

        const data = await readApiResponse(response);

        // Clear sensitive values from the form.
        verificationCode.value = "";
        newPassword.value = "";
        confirmPassword.value = "";

        showPanel("login");
        loginEmail.value = email;
        loginPassword.value = "";

        showMessage(
            data.message || "Password reset successfully. Please sign in.",
            "success"
        );

    } catch (error) {
        console.error("Reset password error:", error);
        showMessage(error.message || "Unable to reset your password.", "error");

    } finally {
        resetPasswordButton.disabled = false;
        resetPasswordButton.textContent = "Reset Password";
    }
});

// ================= RESEND VERIFICATION CODE =================
resendCodeButton.addEventListener("click", async () => {
    clearMessage();

    const email = passwordResetEmail || resetEmail.value.trim().toLowerCase();

    if (!email) {
        showMessage("Enter your email address first.", "error");
        showPanel("forgot");
        return;
    }

    resendCodeButton.disabled = true;
    resendCodeButton.textContent = "Sending...";

    try {
        // The current authController has no dedicated resend endpoint.
        // Request a new code through the forgot-password endpoint.
        const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ email })
        });

        const data = await readApiResponse(response);

        passwordResetEmail = email;
        resetEmail.value = email;
        verificationCode.value = "";

        showMessage(
            data.message ||
            "If this email is registered, a new verification code will be sent.",
            "success"
        );

    } catch (error) {
        console.error("Resend code error:", error);
        showMessage(error.message || "Unable to resend the code.", "error");

    } finally {
        resendCodeButton.disabled = false;
        resendCodeButton.textContent = "Resend Verification Code";
    }
});
