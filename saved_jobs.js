document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  const container = document.getElementById("savedJobsContainer");

  if (!container) return console.error("savedJobsContainer not found");

  // This page only makes sense when logged in
  const isLoggedIn = !!localStorage.getItem("userName");
  if (!isLoggedIn) {
    if (typeof window.requireAuth === "function") {
      window.requireAuth(() => window.location.reload());
    }
    container.innerHTML = "<p class='no-ads'>Please log in to view your saved jobs.</p>";
    return;
  }

  function renderSavedJobs(jobs) {
    container.innerHTML = "";

    if (!Array.isArray(jobs) || jobs.length === 0) {
      container.innerHTML = "<p class='no-ads'>You haven't bookmarked any jobs yet.</p>";
      return;
    }

    jobs.forEach((job) => {
      const minSalary = job.salary_min ? `₱${Number(job.salary_min).toLocaleString()}` : "N/A";
      const maxSalary = job.salary_max ? `₱${Number(job.salary_max).toLocaleString()}` : "N/A";

      const card = document.createElement("div");
      card.classList.add("jobs-card");

      card.innerHTML = `
        <button class="bookmark-btn active" aria-label="Remove bookmark">★</button>
        <h3>${job.title || "No title"}</h3>
        <p class="job-type">${job.job_type || "N/A"}</p>
        <p class="company-name">${job.company_name || "Company Name"}</p>
        <p class="location">${job.location || "Location"}</p>
        <p class="salary">${minSalary} - ${maxSalary}</p>
      `;

      // Un-bookmark directly from this page
      const bookmarkBtn = card.querySelector(".bookmark-btn");
      bookmarkBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          const res = await fetch(`${API_BASE}/api/bookmarks/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ job_id: job.id })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to update bookmark");

          if (!data.bookmarked) {
            card.remove();
            if (!container.querySelector(".jobs-card")) {
              container.innerHTML = "<p class='no-ads'>You haven't bookmarked any jobs yet.</p>";
            }
          }
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      });

      // Click card to view job details
      card.addEventListener("click", () => {
        window.location.href = `view_joblist.html?id=${job.id}`;
      });

      container.appendChild(card);
    });
  }

  fetch(`${API_BASE}/api/bookmarks/jobs`, { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    })
    .then(jobs => {
      if (!Array.isArray(jobs)) throw new Error("Unexpected response shape");
      renderSavedJobs(jobs);
    })
    .catch(err => {
      console.error("Error loading saved jobs:", err);
      container.innerHTML = "<p class='no-ads'>Error loading saved jobs.</p>";
    });

});
