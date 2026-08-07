document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";

  // Private dashboard page — require login before doing anything else
  const isLoggedIn = !!localStorage.getItem("userName");
  if (!isLoggedIn) {
    if (typeof window.requireAuth === "function") {
      window.requireAuth(() => window.location.reload());
    }
    return;
  }

  // =====================
  // INJECT BOOKMARK BUTTON STYLES (no separate CSS file needed)
  // =====================
  (function injectBookmarkStyles() {
    if (document.getElementById("bookmark-btn-styles")) return;

    const style = document.createElement("style");
    style.id = "bookmark-btn-styles";
    style.textContent = `
      .jobs-card {
        position: relative;
      }
      .bookmark-btn {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
      }
      .bookmark-btn svg {
        width: 16px;
        height: 16px;
        display: block;
      }
      .bookmark-btn:hover {
        transform: scale(1.08);
      }
      .bookmark-btn.active {
        background: #f5b400;
        color: #1a1a2e;
      }
      .bookmark-btn:disabled {
        opacity: 0.6;
        cursor: default;
      }
    `;
    document.head.appendChild(style);
  })();

  // =====================
  // STAR ICON (outline when not bookmarked, filled when bookmarked)
  // =====================
  const STAR_PATH = "M12 2 L14.9 8.6 L22 9.3 L16.5 14.1 L18.2 21 L12 17.3 L5.8 21 L7.5 14.1 L2 9.3 L9.1 8.6 Z";

  function starSVG(filled) {
    return `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="${STAR_PATH}"
          fill="${filled ? "currentColor" : "none"}"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linejoin="round" />
      </svg>
    `;
  }

  const dashboard = document.querySelector(".dashboard-content");
  const postJobBtn = document.querySelector("#postJob");
  const cancelBtn = document.querySelector("#cancel");
  const submitBtn = document.querySelector("#post");

  const container = document.getElementById("jobsContainer");
  const nextBtn = document.getElementById("nextBtn");

  const dashboardInputs = dashboard.querySelectorAll("input, textarea");

  // Set of job ids the current user has bookmarked
  let bookmarkedIds = new Set();

  // =====================
  // FIELD VALIDATION
  // =====================
  function checkFields() {
    let allFilled = true;

    dashboardInputs.forEach(input => {
      if (!input.value.trim()) allFilled = false;
    });

    submitBtn.disabled = !allFilled;
  }

  // =====================
  // OPEN FORM
  // =====================
  postJobBtn?.addEventListener("click", () => {
    dashboard.style.display = "block";
    postJobBtn.style.display = "none";
    submitBtn.disabled = true;
  });

  cancelBtn?.addEventListener("click", () => {
    dashboard.style.display = "none";
    postJobBtn.style.display = "inline-block";

    dashboardInputs.forEach(input => input.value = "");
    submitBtn.disabled = true;
  });

  dashboardInputs.forEach(input => {
    input.addEventListener("input", checkFields);
  });

  // =====================
  // POST JOB (FIXED)
  // =====================
  submitBtn?.addEventListener("click", async () => {

    const salaryMinRaw = document.getElementById("salaryminInput").value.trim();
    const salaryMaxRaw = document.getElementById("salarymaxInput").value.trim();

    const jobData = {
      title: document.getElementById("jobtitleInput").value.trim(),
      description: document.getElementById("jobdescriptionInput").value.trim(),
      salary_min: salaryMinRaw ? Number(salaryMinRaw) : null,
      salary_max: salaryMaxRaw ? Number(salaryMaxRaw) : null,
      location: document.getElementById("joblocationInput").value.trim(),
      job_type: document.getElementById("jobtypeInput").value.trim(),
      contact_no: document.getElementById("contactInput").value.trim(),
      email: document.getElementById("emailInput").value.trim()
    };

    try {
      const res = await fetch(`${API_BASE}/api/jobpost`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(jobData)
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("JOB POST ERROR:", data);
        alert(data.error || "Failed to post job");
        return;
      }

      alert("Job posted successfully!");

      dashboard.style.display = "none";
      postJobBtn.style.display = "inline-block";

      dashboardInputs.forEach(input => input.value = "");
      submitBtn.disabled = true;

      loadJobs();

    } catch (err) {
      console.error("POST JOB ERROR:", err);
      alert("Server error while posting job");
    }
  });

  // =====================
  // LOAD BOOKMARKED IDS
  // =====================
  async function loadBookmarkedIds() {
    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/my`, {
        method: "GET",
        credentials: "include"
      });

      const jobIds = await res.json();

      bookmarkedIds = new Set(Array.isArray(jobIds) ? jobIds : []);

    } catch (err) {
      console.error("LOAD BOOKMARKS ERROR:", err);
      bookmarkedIds = new Set();
    }
  }

  // =====================
  // TOGGLE BOOKMARK
  // =====================
  async function toggleBookmark(jobId, btn) {
    btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ job_id: jobId })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update bookmark");

      if (data.bookmarked) {
        bookmarkedIds.add(jobId);
        btn.innerHTML = starSVG(true);
        btn.classList.add("active");
      } else {
        bookmarkedIds.delete(jobId);
        btn.innerHTML = starSVG(false);
        btn.classList.remove("active");
      }

    } catch (err) {
      console.error("TOGGLE BOOKMARK ERROR:", err);
      alert(err.message);
    } finally {
      btn.disabled = false;
    }
  }

  // =====================
  // LOAD JOBS
  // =====================
  async function loadJobs() {
    try {
      await loadBookmarkedIds();

      const res = await fetch(`${API_BASE}/api/jobpost`, {
        method: "GET",
        credentials: "include"
      });

      const jobs = await res.json();

      container.innerHTML = "";

      if (!Array.isArray(jobs) || jobs.length === 0) {
        container.innerHTML = "<p>No job ads found.</p>";
        return;
      }

      jobs.forEach(job => {

        const card = document.createElement("div");
        card.classList.add("jobs-card");

        card.dataset.id = job.id;
        card.dataset.active = job.is_active;

        const minSalary = job.salary_min
          ? `₱${Number(job.salary_min).toLocaleString()}`
          : "N/A";

        const maxSalary = job.salary_max
          ? `₱${Number(job.salary_max).toLocaleString()}`
          : "N/A";

        const isBookmarked = bookmarkedIds.has(job.id);

        card.innerHTML = `
          <button class="bookmark-btn ${isBookmarked ? "active" : ""}" data-id="${job.id}" aria-label="Bookmark job">
            ${starSVG(isBookmarked)}
          </button>
          <h3>${job.title || "No title"}</h3>
          <p class="job-type">${job.job_type || "N/A"}</p>
          <p class="salary">${minSalary} - ${maxSalary}</p>
        `;

        // Bookmark button click — must not trigger card navigation
        const bookmarkBtn = card.querySelector(".bookmark-btn");
        bookmarkBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleBookmark(job.id, bookmarkBtn);
        });

        card.addEventListener("click", () => {
          window.location.href = `view_joblist.html?id=${job.id}`;
        });

        container.appendChild(card);
      });

    } catch (err) {
      console.error("LOAD JOBS ERROR:", err);
      container.innerHTML = "<p>Failed to load jobs</p>";
    }
  }

  // =====================
  // SCROLL
  // =====================
  nextBtn?.addEventListener("click", () => {
    container.scrollBy({ left: 300, behavior: "smooth" });
  });

  // INIT
  loadJobs();
});
