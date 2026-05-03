const API_BASE = "https://hirelink-backend-qnww.onrender.com";

document.getElementById("contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.querySelector(".send-btn");
  btn.textContent = "Sending...";
  btn.disabled = true;

  const res = await fetch(`${API_BASE}/api/contact/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: e.target.name.value,
      company: e.target.company.value,
      email: e.target._replyto.value,
      message: e.target.message.value,
      inquiryType: e.target["inquiry-type"].value
    })
  });

  if (res.ok) {
    alert("Message sent! We'll get back to you soon.");
    e.target.reset();
  } else {
    alert("Failed to send. Please try again.");
  }

  btn.textContent = "Send Message ✉";
  btn.disabled = false;
});
