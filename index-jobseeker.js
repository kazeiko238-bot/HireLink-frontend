const API_BASE = "https://hirelink-backend-qnww.onrender.com";

// ======================================================
// ORIGINAL HTML ELEMENTS
// ======================================================

const registerFields = document.getElementById("jobseeker-fields");
const terms = document.querySelector("#register .remember-me");
const verifySection = document.getElementById("verify-section");

const loginForm = document.getElementById("login");
const registerForm = document.getElementById("register");

const tabLinks = document.querySelectorAll(".tab-link");
const createBtn = document.querySelector('[name="create-btn"]');
const loginBtn = document.querySelector('[name="login-btn"]');

const codeInputs = document.querySelectorAll(
    "#verify-section .code-inputs input"
);

const registerVerifyBtn = document.querySelector(".verify-btn");
const resendRegistrationCode = document.getElementById("resend-code");

// ======================================================
// FORGOT / RESET PASSWORD ELEMENTS
// ======================================================

const forgotForm = document.getElementById("forgot-password");
const resetForm = document.getElementById("reset-password");

const forgotEmail = document.getElementById("forgot-email");
const resetEmail = document.getElementById("reset-email");
const resetCode = document.getElementById("reset-code");
const newPassword = document.getElementById("new-password");
const confirmNewPassword = document.getElementById("confirm-new-password");

const forgotLink = document.getElementById("forgotPasswordLink");
const backToLogin = document.getElementById("back-to-login");
const changeResetEmail = document.getElementById("change-reset-email");

const sendResetCodeBtn = document.getElementById("send-reset-code");
const resetPasswordBtn = document.getElementById("submit-reset-password");
const resendResetCodeBtn = document.getElementById("resend-reset-code");

const forgotMessage = document.getElementById("forgot-message");
const resetMessage = document.getElementById("reset-message");

let registrationInProgress = false;

// ======================================================
// MESSAGE HELPERS
// ======================================================

function showFormMessage(element, message, type = "info") {
    if (!element) {
        alert(message);
        return;
    }

    element.textContent = message;
    element.className = `message show ${type}`;
}

function clearFormMessages() {
    [forgotMessage, resetMessage].forEach(element => {
        if (element) {
            element.textContent = "";
            element.className = "";
        }
    });
}

function setLoading(button, loading, normalText, loadingText) {
    if (!button) return;

    button.disabled = loading;
    button.textContent = loading ? loadingText : normalText;
}

// ======================================================
// API HELPERS
// ======================================================

async function readResponse(response) {
    const text = await response.text();
    let data = {};

    try {
        data = text ? JSON.parse(text) : {};
    } catch (error) {
        console.error("Invalid server response:", {
            url: response.url,
            status: response.status,
            response: text.slice(0, 300)
        });

        throw new Error(
            response.status === 404
                ? "API route not found. Check your backend routes."
                : "Unexpected server response. Check the backend logs."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.error || data.message || `Request failed (${response.status}).`
        );
    }

    return data;
}

async function postJSON(endpoint, body) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(body)
    });

    return readResponse(response);
}

// ======================================================
// PANEL NAVIGATION
// ======================================================

function showPanel(panelName) {
    const panels = {
        login: loginForm,
        register: registerForm,
        forgot: forgotForm,
        reset: resetForm
    };

    Object.entries(panels).forEach(([name, panel]) => {
        if (!panel) return;

        const visible = name === panelName;

        panel.hidden = !visible;
        panel.classList.toggle("active", visible);
    });

    clearFormMessages();
}

tabLinks.forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        const tab = link.dataset.tab;

        if (tab === "login" || tab === "register") {
            showPanel(tab);
        }
    });
});

if (forgotLink) {
    forgotLink.addEventListener("click", event => {
        event.preventDefault();

        forgotEmail.value =
            document.getElementById("login-email").value.trim();

        showPanel("forgot");
    });
}

if (backToLogin) {
    backToLogin.addEventListener("click", event => {
        event.preventDefault();
        showPanel("login");
    });
}

if (changeResetEmail) {
    changeResetEmail.addEventListener("click", event => {
        event.preventDefault();

        forgotEmail.value = resetEmail.value.trim();
        showPanel("forgot");
    });
}

// ======================================================
// SHOW / HIDE PASSWORD
// ======================================================

document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (!input) return;

        const show = input.type === "password";

        input.type = show ? "text" : "password";
        button.textContent = show ? "Hide" : "Show";
    });
});

// ======================================================
// REGISTRATION
// POST /api/verification/send-code
// ======================================================

createBtn.addEventListener("click", async event => {
    event.preventDefault();

    if (registrationInProgress) return;

    const fName = document.getElementById("register-fname").value.trim();
    const lName = document.getElementById("register-lname").value.trim();
    const email = document.getElementById("register-email").value.trim().toLowerCase();
    const password = document.getElementById("register-password").value;
    const confirmPassword = document.getElementById("register-confirm-password").value;
    const termsCheckbox = document.getElementById("terms");

    if (!fName || !lName || !email || !password || !confirmPassword) {
        alert("Fill in all required fields!");
        return;
    }

    if (!document.getElementById("register-email").checkValidity()) {
        alert("Enter a valid email address.");
        return;
    }

    if (password.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
    }

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    if (!termsCheckbox.checked) {
        alert("Please agree to the Terms of Service and Privacy Policy.");
        return;
    }

    registrationInProgress = true;
    setLoading(createBtn, true, "Create Account", "Sending code...");

    try {
        const data = await postJSON("/api/verification/send-code", {
            fName,
            lName,
            email,
            password,
            role: "jobseeker"
        });

        console.log("Send registration code response:", data);

        registerFields.style.display = "none";
        terms.style.display = "none";
        createBtn.style.display = "none";
        verifySection.style.display = "block";

        codeInputs.forEach(input => {
            input.value = "";
        });

        codeInputs[0]?.focus();

        alert(data.message || "Verification code sent. Check your email.");
    } catch (error) {
        console.error("Registration error:", error);
        alert(error.message || "Failed to send verification code.");
    } finally {
        registrationInProgress = false;
        setLoading(createBtn, false, "Create Account", "Sending code...");
    }
});

// ======================================================
// REGISTRATION CODE INPUTS
// ======================================================

codeInputs.forEach((input, index) => {
    input.addEventListener("input", event => {
        event.target.value = event.target.value.replace(/\D/g, "").slice(-1);

        if (event.target.value && codeInputs[index + 1]) {
            codeInputs[index + 1].focus();
        }
    });

    input.addEventListener("keydown", event => {
        if (
            event.key === "Backspace" &&
            !input.value &&
            codeInputs[index - 1]
        ) {
            codeInputs[index - 1].focus();
        }
    });
});

// ======================================================
// VERIFY REGISTRATION CODE
// POST /api/verification/verify-code
// ======================================================

registerVerifyBtn.addEventListener("click", async () => {
    const code = Array.from(codeInputs)
        .map(input => input.value.trim())
        .join("");

    if (!/^\d{6}$/.test(code)) {
        alert("Enter the complete 6-digit verification code.");
        return;
    }

    setLoading(registerVerifyBtn, true, "Verify", "Verifying...");

    try {
        const data = await postJSON("/api/verification/verify-code", {
            code
        });

        alert(data.message || "Account created successfully!");
        window.location.href = "/jobs.html";
    } catch (error) {
        console.error("Registration verification error:", error);
        alert(`Verification failed: ${error.message}`);
    } finally {
        setLoading(registerVerifyBtn, false, "Verify", "Verifying...");
    }
});

// ======================================================
// RESEND REGISTRATION CODE
// POST /api/verification/resend-code
// ======================================================

resendRegistrationCode.addEventListener("click", async () => {
    try {
        const response = await fetch(
            `${API_BASE}/api/verification/resend-code`,
            {
                method: "POST",
                credentials: "include"
            }
        );

        const data = await readResponse(response);

        alert(data.message || "Verification code sent again!");
    } catch (error) {
        console.error("Resend registration code error:", error);
        alert(error.message || "Failed to resend verification code.");
    }
});

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

loginBtn.addEventListener("click", async event => {
    event.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    setLoading(loginBtn, true, "Login", "Signing in...");

    try {
        const data = await postJSON("/api/auth/login", {
            email,
            password
        });

        localStorage.setItem("userName", data.name || data.userName || "");
        localStorage.setItem("userRole", data.role || "");

        const overlay = document.getElementById("loginOverlay");

        if (overlay) {
            overlay.classList.add("hidden");
        }

        if (data.role === "jobseeker") {
            window.location.href = "jobs.html";
        } else if (data.role === "employer") {
            window.location.href = "people.html";
        } else {
            alert("Login succeeded, but the account role was not recognized.");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert(error.message || "Login failed.");
    } finally {
        setLoading(loginBtn, false, "Login", "Signing in...");
    }
});

// ======================================================
// FORGOT PASSWORD — SEND VERIFICATION CODE
// POST /api/auth/forgot-password
// ======================================================

sendResetCodeBtn.addEventListener("click", async event => {
    event.preventDefault();

    const email = forgotEmail.value.trim().toLowerCase();

    if (!email || !forgotEmail.checkValidity()) {
        showFormMessage(
            forgotMessage,
            "Please enter a valid email address.",
            "error"
        );
        return;
    }

    setLoading(
        sendResetCodeBtn,
        true,
        "Send Verification Code",
        "Sending code..."
    );

    try {
        const data = await postJSON("/api/auth/forgot-password", { email });

        resetEmail.value = email;
        resetCode.value = "";
        newPassword.value = "";
        confirmNewPassword.value = "";

        showPanel("reset");

        showFormMessage(
            resetMessage,
            data.message ||
                "If this email is registered, a verification code will be sent.",
            "success"
        );
    } catch (error) {
        console.error("Forgot-password error:", error);

        showFormMessage(
            forgotMessage,
            error.message || "Unable to send the verification code.",
            "error"
        );
    } finally {
        setLoading(
            sendResetCodeBtn,
            false,
            "Send Verification Code",
            "Sending code..."
        );
    }
});

// ======================================================
// RESET PASSWORD
// POST /api/auth/reset-password
// ======================================================

resetPasswordBtn.addEventListener("click", async event => {
    event.preventDefault();

    const email = resetEmail.value.trim().toLowerCase();
    const code = resetCode.value.trim();
    const password = newPassword.value;
    const confirmation = confirmNewPassword.value;

    if (!/^\d{6}$/.test(code)) {
        showFormMessage(
            resetMessage,
            "Enter the complete 6-digit verification code.",
            "error"
        );
        return;
    }

    if (password.length < 8) {
        showFormMessage(
            resetMessage,
            "Your new password must contain at least 8 characters.",
            "error"
        );
        return;
    }

    if (password.length > 128) {
        showFormMessage(
            resetMessage,
            "Your password cannot exceed 128 characters.",
            "error"
        );
        return;
    }

    if (password !== confirmation) {
        showFormMessage(
            resetMessage,
            "Your new passwords do not match.",
            "error"
        );
        return;
    }

    setLoading(
        resetPasswordBtn,
        true,
        "Reset Password",
        "Resetting password..."
    );

    try {
        const data = await postJSON("/api/auth/reset-password", {
            email,
            code,
            newPassword: password
        });

        resetCode.value = "";
        newPassword.value = "";
        confirmNewPassword.value = "";

        showPanel("login");

        document.getElementById("login-email").value = email;
        document.getElementById("login-password").value = "";

        alert(
            data.message ||
            "Password reset successfully. Please sign in with your new password."
        );
    } catch (error) {
        console.error("Reset-password error:", error);

        showFormMessage(
            resetMessage,
            error.message || "Unable to reset your password.",
            "error"
        );
    } finally {
        setLoading(
            resetPasswordBtn,
            false,
            "Reset Password",
            "Resetting password..."
        );
    }
});

// ======================================================
// RESEND PASSWORD RESET CODE
// Reuses /api/auth/forgot-password
// ======================================================

resendResetCodeBtn.addEventListener("click", async event => {
    event.preventDefault();

    const email = resetEmail.value.trim().toLowerCase();

    if (!email) {
        showPanel("forgot");

        showFormMessage(
            forgotMessage,
            "Please enter your email address.",
            "error"
        );
        return;
    }

    setLoading(resendResetCodeBtn, true, "Resend Code", "Sending...");

    try {
        const data = await postJSON("/api/auth/forgot-password", { email });

        resetCode.value = "";

        showFormMessage(
            resetMessage,
            data.message ||
                "If this email is registered, a new verification code will be sent.",
            "success"
        );
    } catch (error) {
        console.error("Resend reset code error:", error);

        showFormMessage(
            resetMessage,
            error.message || "Unable to resend the code.",
            "error"
        );
    } finally {
        setLoading(resendResetCodeBtn, false, "Resend Code", "Sending...");
    }
});

// ======================================================
// INITIAL STATE
// ======================================================

if (forgotForm) forgotForm.hidden = true;
if (resetForm) resetForm.hidden = true;

loginForm.classList.add("active");
registerForm.classList.remove("active");
