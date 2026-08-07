document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";

  const container = document.getElementById("savedAdsContainer");
  const nextBtn = document.getElementById("nextBtn");

  if (!container) return console.error("savedAdsContainer not found");

  // Private page — require login before doing anything else
  const isLoggedIn = !!localStorage.getItem("userName");
  if (!isLoggedIn) {
    if (typeof window.requireAuth === "function") {
      window.requireAuth(() => window.location.reload());
    }
    container.innerHTML = "<p class='no-ads'>Please log in to view your saved job ads.</p>";
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
        font-size: 16px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
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
  // REMOVE BOOKMARK (toggle off)
  // =====================
  async function removeBookmark(jobId, card, btn) {
    btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ job_id: jobId })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to remove bookmark");

      // Since it was already bookmarked, toggling should always return bookmarked:false
      if (!data.bookmarked) {
        card.remove();

        if (!container.querySelector(".jobs-card")) {
          container.innerHTML = "<p class='no-ads'>You haven't saved any job ads yet.</p>";
        }
      }

    } catch (err) {
      console.error("REMOVE BOOKMARK ERROR:", err);
      alert(err.message);
      btn.disabled = false;
    }
  }

  // =====================
  // RENDER
  // =====================
  function renderSavedAds(jobs) {
    container.innerHTML = "";

    if (!Array.isArray(jobs) || jobs.length === 0) {
      container.innerHTML = "<p class='no-ads'>You haven't saved any job ads yet.</p>";
      return;
    }

    jobs.forEach(job => {

      const card = document.createElement("div");
      card.classList.add("jobs-card");
      card.dataset.id = job.id;

      const minSalary = job.salary_min
        ? `₱${Number(job.salary_min).toLocaleString()}`
        : "N/A";

      const maxSalary = job.salary_max
        ? `₱${Number(job.salary_max).toLocaleString()}`
        : "N/A";

      card.innerHTML = `
        <button class="bookmark-btn active" data-id="${job.id}" aria-label="Remove bookmark">★</button>
        <h3>${job.title || "No title"}</h3>
        <p class="job-type">${job.job_type || "N/A"}</p>
        <p class="company-name">${job.company_name || ""}</p>
        <p class="salary">${minSalary} - ${maxSalary}</p>
      `;

      const bookmarkBtn = card.querySelector(".bookmark-btn");
      bookmarkBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeBookmark(job.id, card, bookmarkBtn);
      });

      card.addEventListener("click", () => {
        window.location.href = `view_joblist.html?id=${job.id}`;
      });

      container.appendChild(card);
    });
  }

  // =====================
  // LOAD
  // =====================
  fetch(`${API_BASE}/api/bookmarks/jobs`, { credentials: "include" })
    .then(res => {
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      return res.json();
    })
    .then(jobs => {
      if (!Array.isArray(jobs)) throw new Error("Unexpected response shape");
      renderSavedAds(jobs);
    })
    .catch(err => {
      console.error("Error loading saved job ads:", err);
      container.innerHTML = "<p class='no-ads'>Error loading saved job ads.</p>";
    });

  // =====================
  // SCROLL
  // =====================
  nextBtn?.addEventListener("click", () => {
    container.scrollBy({ left: 300, behavior: "smooth" });
  });
});
