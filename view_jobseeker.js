// -------- Back button --------
document.querySelector('.back-btn')?.addEventListener('click', () => {
  if (document.referrer) window.history.back();
  else window.location.href = '/';
});

// Get jobseeker id from URL
const params = new URLSearchParams(window.location.search);
const jobseekerId = params.get("id");

const resumeBtn = document.getElementById("viewResumeBtn");
const hireBtn = document.getElementById("hireBtn"); // 🔥 ADD THIS
const resumeViewer = document.getElementById("resumeViewer");
const resumeFrame = document.getElementById("resumeFrame");

let resumePath = null;

// =====================
// CHECK USER ROLE (FIXED)
// =====================
fetch("/api/me", { credentials: "include" })
  .then(res => res.json())
  .then(user => {
    if (user?.role === "jobseeker") {
      // 🔥 hide BOTH buttons
      if (resumeBtn) resumeBtn.style.display = "none";
      if (hireBtn) hireBtn.style.display = "none";
    }
  })
  .catch(() => {
    // fail safe (don’t break UI)
  });

// =====================
// LOAD PROFILE
// =====================
async function loadProfile() {
  try {
    const res = await fetch("/api/jobseekers", {
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

    // store resume path
    resumePath = data.resume || null;

  } catch (err) {
    console.error("Error loading profile:", err);
  }
}

// =====================
// VIEW RESUME BUTTON
// =====================
resumeBtn?.addEventListener("click", () => {
  if (!resumePath) {
    alert("No resume uploaded");
    return;
  }

  resumeViewer.classList.remove("hidden");
  resumeFrame.src = resumePath + "#toolbar=0";
});

// INIT
loadProfile();