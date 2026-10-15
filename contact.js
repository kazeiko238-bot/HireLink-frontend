const API_BASE = "https://hirelink-backend-qnww.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  const statusEl = document.getElementById("formStatus");
  const sendBtn = form.querySelector(".send-btn");
  const originalBtnText = sendBtn.textContent;

  function showStatus(text, isError) {
    statusEl.textContent = text;
    statusEl.style.color = isError ? "#c0392b" : "#1e8449";
    statusEl.style.fontWeight = "600";
    statusEl.style.margin = "12px 0 0";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") || "").trim(),
      company: String(data.get("company") || "").trim(),
      email: String(data.get("_replyto") || "").trim(),
      message: String(data.get("message") || "").trim(),
      inquiryType: String(data.get("inquiry-type") || "General"),
      website: String(data.get("website") || "") // hidden spam trap
    };

    sendBtn.disabled = true;
    sendBtn.textContent = "Sending...";
    showStatus("Sending your message. The server may take a few seconds to wake up.", false);

    // Render's free tier can take up to a minute to wake up.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${API_BASE}/api/contact/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // lets the server link the message to a logged-in user
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      let result = {};
      try {
        result = await res.json();
      } catch (_) {
        // The server did not return JSON; fall through to the error below.
      }

      if (res.ok) {
        showStatus(result.message || "Message sent! We will get back to you soon.", false);
        form.reset();
      } else {
        showStatus(result.error || "Failed to send. Please try again.", true);
      } 

    } catch (err) {
      console.error("Contact form error:", err);

      if (err.name === "AbortError") {
        showStatus("The server took too long to respond. Please try again.", true);
      } else {
        showStatus("Could not reach the server. Check your connection and try again.", true);
      }

    } finally {
      clearTimeout(timeoutId);
      sendBtn.disabled = false;
      sendBtn.textContent = originalBtnText;
    }
  });
});
