document.querySelector('.back-btn')?.addEventListener('click', () => {
  if (document.referrer) window.history.back();
  else window.location.href = '/';
});

const API_BASE = "https://hirelink-backend-qnww.onrender.com";

const params = new URLSearchParams(window.location.search);
const jobseekerId = params.get("id");

const resumeBtn = document.getElementById("viewResumeBtn");
const hireBtn = document.getElementById("hireBtn");
const resumeViewer = document.getElementById("resumeViewer");
const resumeFrame = document.getElementById("resumeFrame");

let resumePath = null;

fetch(`${API_BASE}/api/me`, { credentials: "include" })
  .then(res => res.json())
  .then(user => {
    if (user?.role === "jobseeker") {
      if (resumeBtn) resumeBtn.style.display = "none";
      if (hireBtn) hireBtn.style.display = "none";
    }
  })
  .catch(() => {});

async function loadProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/jobseekers`, {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to load profile");

    const users = await res.json();

    const data = users.find(u => String(u.id) === jobseekerId);

    if (!data) {
      console.error("Jobseeker not found");
      return;
    }

    document.getElementById("full_name").textContent = data.name || "";
    document.getElementById("profession").textContent = data.profession || "";
    document.getElementById("job_position").textContent = data.position || "";
    document.getElementById("current_company").textContent = data.company || "";
    document.getElementById("expected_salary").textContent = data.salary || "";
    document.getElementById("location").textContent = data.location || "";

    const email = document.getElementById("email");
    email.textContent = data.email || "";
    email.href = "mailto:" + data.email;

    document.getElementById("description").textContent = data.description || "";

    resumePath = data.resume || null;

  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

resumeBtn?.addEventListener("click", () => {
  if (resumeBtn.textContent === "Close") {
    resumeViewer.classList.add("hidden");
    resumeFrame.src = "";
    resumeBtn.textContent = "View Resume";
    return;
  }

  if (!resumePath) {
    alert("No resume uploaded");
    return;
  }

  resumeViewer.classList.remove("hidden");
  resumeFrame.src = resumePath + "#toolbar=0";
  resumeBtn.textContent = "Close";
});

resumeViewer?.addEventListener("click", (e) => {
  if (e.target === resumeViewer) {
    resumeViewer.classList.add("hidden");
    resumeFrame.src = "";
    resumeBtn.textContent = "View Resume";
  }
});

loadProfile();
