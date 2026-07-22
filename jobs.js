document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";

  const container = document.getElementById("jobsContainer");
  const nextBtn = document.getElementById("nextBtn");

  const titleInput = document.querySelector(".search-group input");
  const provinceInput = document.getElementById("provinceInput");
  const searchBtn = document.querySelector(".search-btn");

  let allJobs = [];
  let bookmarkedIds = new Set();

  if (!container) return console.error("jobsContainer not found");

  // --- LOAD MY BOOKMARKS (if logged in; empty for guests) ---
  async function loadBookmarks() {
    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/my`, { credentials: "include" });
      const ids = await res.json();
      if (Array.isArray(ids)) bookmarkedIds = new Set(ids);
    } catch (err) {
      console.error("Error loading bookmarks:", err);
    }
  }

  // --- 1. RENDERER ---
  function renderJobs(jobsToDisplay) {
    container.innerHTML = "";

    if (!Array.isArray(jobsToDisplay) || jobsToDisplay.length === 0) {
      container.innerHTML = "<p class='no-ads'>No jobs found matching your search.</p>";
      return;
    }

    jobsToDisplay.forEach((job) => {
      const minSalary = job.salary_min ? `₱${Number(job.salary_min).toLocaleString()}` : "N/A";
      const maxSalary = job.salary_max ? `₱${Number(job.salary_max).toLocaleString()}` : "N/A";

      const card = document.createElement("div");
      card.classList.add("jobs-card");

      const isBookmarked = bookmarkedIds.has(job.id);

      card.innerHTML = `
          <button class="bookmark-btn ${isBookmarked ? "active" : ""}" aria-label="Bookmark job">
            ${isBookmarked ? "★" : "☆"}
          </button>
          <h3>${job.title || "No title"}</h3>
          <p class="job-type">${job.job_type || "N/A"}</p>
          <p class="company-name">${job.company_name || "Company Name"}</p>
          <p class="location">${job.location || "Location"}</p>
          <p class="salary">${minSalary} - ${maxSalary}</p>
        `;

      // Bookmark click — requires login, doesn't navigate
      const bookmarkBtn = card.querySelector(".bookmark-btn");
      bookmarkBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const proceed = async () => {
          try {
            const res = await fetch(`${API_BASE}/api/bookmarks/toggle`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ job_id: job.id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to update bookmark");

            if (data.bookmarked) {
              bookmarkedIds.add(job.id);
              bookmarkBtn.textContent = "★";
              bookmarkBtn.classList.add("active");
            } else {
              bookmarkedIds.delete(job.id);
              bookmarkBtn.textContent = "☆";
              bookmarkBtn.classList.remove("active");
            }
          } catch (err) {
            console.error(err);
            alert(err.message);
          }
        };

        if (typeof window.requireAuth === "function") {
          if (window.requireAuth(proceed)) proceed();
        } else {
          proceed();
        }
      });

      // Card click — view job details, requires login
      card.addEventListener("click", () => {
        const proceed = () => {
          window.location.href = `view_joblist.html?id=${job.id}`;
        };

        if (typeof window.requireAuth === "function") {
          if (window.requireAuth(proceed)) proceed();
        } else {
          proceed();
        }
      });

      container.appendChild(card);
    });
  }

  // --- 2. FETCH ---
  Promise.all([
    fetch(`${API_BASE}/api/jobpost/list`).then(res => res.json()),
    loadBookmarks()
  ])
    .then(([jobs]) => {
      allJobs = jobs;
      renderJobs(allJobs);
    })
    .catch((err) => {
      console.error("Error fetching jobs:", err);
      container.innerHTML = "<p class='no-ads'>Error loading jobs.</p>";
    });

  // --- 3. LIVE SEARCH & CLEAR LOGIC ---
  const handleSearch = () => {
    const titleQuery = titleInput ? titleInput.value.toLowerCase().trim() : "";
    const provinceQuery = provinceInput ? provinceInput.value.toLowerCase().trim() : "";

    toggleClearBtn(titleInput);
    toggleClearBtn(provinceInput);

    const filteredJobs = allJobs.filter((job) => {
      const jobTitle = (job.title || "").toLowerCase();
      const jobLocation = (job.location || "").toLowerCase();
      return jobTitle.includes(titleQuery) && jobLocation.includes(provinceQuery);
    });

    renderJobs(filteredJobs);
  };

  function toggleClearBtn(input) {
    if (!input) return;
  }

  const clearSearch = () => {
    if (titleInput) titleInput.value = "";
    if (provinceInput) provinceInput.value = "";
    renderJobs(allJobs);
  };

  if (titleInput) titleInput.addEventListener("input", handleSearch);
  if (provinceInput) provinceInput.addEventListener("input", handleSearch);
  if (searchBtn) searchBtn.addEventListener("click", handleSearch);

  // --- 4. CAROUSEL ---
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      container.scrollBy({ left: 300, behavior: "smooth" });
    });
  }

  const btn = document.querySelector(".notif-btn");
  const dropdown = document.getElementById("notifDropdown");

  if (btn && dropdown) {
    btn.addEventListener("click", () => {
      dropdown.classList.toggle("show");
    });
  }

  document.addEventListener("click", (e) => {
    if (btn && dropdown && !btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });

});
