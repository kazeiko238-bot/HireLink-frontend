const API_BASE = "https://hirelink-backend-qnww.onrender.com";

const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");

// -------- Back button --------
document.querySelector('.back-btn')?.addEventListener('click', () => {
  if (document.referrer) window.history.back();
  else window.location.href = '/';
});

// -------- ROLE UI CONTROL --------
fetch(`${API_BASE}/api/me`, { credentials: "include" })
  .then(res => res.json())
  .then(user => {
    if (user.role === "employer") {
      const btn = document.getElementById("applyBtn");
      if (btn) btn.style.display = "none";
    }

    if (user.role === "jobseeker") {
      const container = document.getElementById("applicationsContainer");
      if (container) container.style.display = "none";
    }

     if (user.role === "jobseeker") {
      const closeBtn = document.getElementById("jobToggleBtn");
      if (closeBtn) closeBtn.style.display = "none";
    }
  });

// =====================
// LOAD JOB DETAILS
// =====================
async function loadProfile() {
  if (!jobId) return console.error("No job id in URL");

  try {
    const res = await fetch(`${API_BASE}/api/jobpost/${jobId}`, {
      credentials: "include"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");

    document.getElementById("job_name").textContent = data.title || "N/A";
    document.getElementById("company_name").textContent = data.company_name || "N/A";
    document.getElementById("email").textContent = data.email || "N/A";
    document.getElementById("job_type").textContent = data.job_type || "N/A";
    document.getElementById("description").textContent = data.description || "N/A";
    document.getElementById("location").textContent = data.location || "N/A";
    document.getElementById("contact_no").textContent = data.contact_no || "N/A";

    document.getElementById("salary_min").textContent =
      data.salary_min ? `₱${Number(data.salary_min).toLocaleString()}` : "N/A";

    document.getElementById("salary_max").textContent =
      data.salary_max ? `₱${Number(data.salary_max).toLocaleString()}` : "N/A";

    document.getElementById("applyBtn").dataset.jobId = data.id ?? jobId;

  } catch (err) {
    console.error("Job load error:", err.message);
  }
}

// =====================
// APPLY JOB
// =====================
document.getElementById("applyBtn")?.addEventListener("click", async function () {
  const jobId = this.dataset.jobId;

  this.disabled = true;
  this.innerText = "Applying...";

  try {
    const res = await fetch(`${API_BASE}/api/application`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ job_id: jobId })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    this.innerText = "Applied ✓";
    this.style.background = "green";

  } catch (err) {
    alert(err.message);
    this.disabled = false;
    this.innerText = "Apply";
  }
});

// =====================
// CHAT
// =====================
async function openChat(otherUserId) {
  try {
    const res = await fetch(`${API_BASE}/api/chat/conversation/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ otherUserId })
    });

    const data = await res.json();

    if (!res.ok || !data.conversationId) {
      throw new Error(data.error || "Failed");
    }

    await fetch(`${API_BASE}/api/chat/context/set`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        otherUserId,
        jobId: null
      })
    });

    window.location.href = "/conversation.html";

  } catch (err) {
    console.error("openChat error:", err);
    alert("Failed to open chat");
  }
}

// =====================
// APPLICATIONS
// =====================
async function loadApplications(jobId) {
  const container = document.getElementById("applicationsContainer");
  if (!container) return;

  const res = await fetch(`${API_BASE}/api/application/${jobId}`, {
    credentials: "include"
  });

  const data = await res.json();
  if (!res.ok) return;

  container.innerHTML = "";

  data.forEach(app => {
    const row = document.createElement("div");
    row.className = "app-row";
    row.dataset.id = app.application_id;

    row.innerHTML = `
      <div class="app-top">

        <div class="app-name">
          ${app.first_name} ${app.last_name}
        </div>

        <div class="app-actions">

          <button class="msg-btn">Message</button>

          <div class="status-dropdown">
            <button class="status-btn">
              ${app.status
                ? app.status.charAt(0).toUpperCase() + app.status.slice(1)
                : "Status ▾"}
            </button>

            <div class="status-menu">
              <div data-status="viewed">Viewed</div>
              <div data-status="shortlisted">Shortlist</div>
              <div data-status="interviewed">Interview</div>
              <div data-status="hired">Hire</div>
              <div data-status="rejected">Reject</div>
            </div>
          </div>

        </div>
      </div>

      <div class="app-date">
        Applied on: ${new Date(app.applied_at).toLocaleString()}
      </div>
    `;

    row.querySelector(".msg-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openChat(app.jobseeker_id);
    });

    row.querySelectorAll(".status-menu div").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();

        const status = btn.dataset.status;

        await setStatus(app.application_id, status);

        row.querySelector(".status-btn").textContent =
          status.charAt(0).toUpperCase() + status.slice(1);
      });
    });

    row.addEventListener("click", (e) => {
      if (e.target.closest(".msg-btn") || e.target.closest(".status-dropdown")) return;

      window.location.href = `/view_jobseeker.html?id=${app.jobseeker_id}`;
    });

    container.appendChild(row);
  });
}

// =====================
// STATUS UPDATE
// =====================
async function setStatus(application_id, status) {
  await fetch(`${API_BASE}/api/application/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ application_id, status })
  });
}

// =====================
// JOB TOGGLE (FIXED LOGIC)
// =====================
let currentJobStatus = 1;

async function loadJobStatus(jobId) {
  const res = await fetch(`/api/jobpost/${jobId}`, {
    credentials: "include"
  });

  const data = await res.json();

  currentJobStatus = Number(data.is_active); // IMPORTANT

  const btn = document.getElementById("jobToggleBtn");
  if (!btn) return;

  updateJobButtonUI(btn);
}

function updateJobButtonUI(btn) {
  if (currentJobStatus === 1) {
    btn.textContent = "Close Job";
    btn.classList.remove("closed");
  } else {
    btn.textContent = "Closed";
    btn.classList.add("closed");
  }
}

// CLICK TOGGLE
document.getElementById("jobToggleBtn")?.addEventListener("click", async () => {

  const newStatus = currentJobStatus === 1 ? 0 : 1;

  const res = await fetch(`${API_BASE}/api/jobpost/toggle`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      jobId,
      is_active: newStatus
    })
  });

  if (!res.ok) {
    alert("Failed to update job status");
    return;
  }

  currentJobStatus = newStatus;

  const btn = document.getElementById("jobToggleBtn");
  updateJobButtonUI(btn);
});

// =====================
// INIT
// =====================
loadProfile();
loadApplications(jobId);
loadJobStatus(jobId);
