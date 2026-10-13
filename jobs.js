```javascript
document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";

  const container = document.getElementById("jobsContainer");
  const nextBtn = document.getElementById("nextBtn");

  // Existing search elements
  const titleInput = document.getElementById("jobSearchInput");
  const provinceInput = document.getElementById("provinceInput");
  const searchBtn = document.querySelector(".search-btn");

  // New filter elements
  const companyInput = document.getElementById("companySearchInput");
  const industryFilter = document.getElementById("industryFilter");
  const jobTypeFilter = document.getElementById("jobTypeFilter");
  const salaryMinFilter = document.getElementById("salaryMinFilter");
  const salaryMaxFilter = document.getElementById("salaryMaxFilter");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");

  let allJobs = [];
  let bookmarkedIds = new Set();

  if (!container) {
    console.error("jobsContainer not found");
    return;
  }


  // ============================================================
  // 1. LOAD MY BOOKMARKS
  // ============================================================

  async function loadBookmarks() {
    try {
      const res = await fetch(`${API_BASE}/api/bookmarks/my`, {
        credentials: "include"
      });

      if (!res.ok) {
        console.warn("Could not load bookmarks:", res.status);
        return;
      }

      const ids = await res.json();

      if (Array.isArray(ids)) {
        bookmarkedIds = new Set(ids);
      }

    } catch (err) {
      console.error("Error loading bookmarks:", err);
    }
  }


  // ============================================================
  // 2. RENDER JOB CARDS
  // ============================================================

  function renderJobs(jobsToDisplay) {
    container.innerHTML = "";

    if (!Array.isArray(jobsToDisplay) || jobsToDisplay.length === 0) {
      container.innerHTML =
        "<p class='no-ads'>No jobs found matching your search.</p>";
      return;
    }

    jobsToDisplay.forEach((job) => {

      const minSalary =
        job.salary_min !== null &&
        job.salary_min !== undefined &&
        job.salary_min !== ""
          ? `₱${Number(job.salary_min).toLocaleString()}`
          : "N/A";

      const maxSalary =
        job.salary_max !== null &&
        job.salary_max !== undefined &&
        job.salary_max !== ""
          ? `₱${Number(job.salary_max).toLocaleString()}`
          : "N/A";

      const card = document.createElement("div");
      card.classList.add("jobs-card");

      const isBookmarked = bookmarkedIds.has(job.id);

      card.innerHTML = `
        <button
          class="bookmark-btn ${isBookmarked ? "active" : ""}"
          aria-label="Bookmark job"
          type="button"
        >
          ${isBookmarked ? "★" : "☆"}
        </button>

        <h3>${job.title || "No title"}</h3>

        <p class="job-type">${job.job_type || "N/A"}</p>

        <p class="company-name">
          ${job.company_name || "Company Name"}
        </p>

        <p class="location">
          ${job.location || "Location"}
        </p>

        <p class="salary">
          ${minSalary} - ${maxSalary}
        </p>
      `;


      // --------------------------------------------------------
      // BOOKMARK BUTTON
      // --------------------------------------------------------

      const bookmarkBtn = card.querySelector(".bookmark-btn");

      bookmarkBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const proceed = async () => {
          try {
            const res = await fetch(`${API_BASE}/api/bookmarks/toggle`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              credentials: "include",
              body: JSON.stringify({
                job_id: job.id
              })
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(
                data.error || "Failed to update bookmark"
              );
            }

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
            console.error("Bookmark error:", err);
            alert(err.message);
          }
        };

        if (typeof window.requireAuth === "function") {
          if (window.requireAuth(proceed)) proceed();
        } else {
          proceed();
        }
      });


      // --------------------------------------------------------
      // JOB CARD CLICK - VIEW JOB DETAILS
      // --------------------------------------------------------

      card.addEventListener("click", () => {

        const proceed = () => {
          window.location.href = `view_joblist.html?id=${job.id}`;
        };

        if (typeof window.requireAuth === "function") {

          if (window.requireAuth(proceed)) proceed();

        } else {

          // Existing login fallback
          const loggedIn = !!localStorage.getItem("userName");

          if (loggedIn) {
            proceed();
          } else {
            const overlay = document.getElementById("loginOverlay");

            if (overlay) {
              overlay.classList.remove("hidden");
            }
          }

        }

      });

      container.appendChild(card);
    });
  }


  // ============================================================
  // 3. FETCH JOBS AND BOOKMARKS
  // ============================================================

  async function loadJobs() {
    try {

      const [jobsResponse] = await Promise.all([
        fetch(`${API_BASE}/api/jobpost/list`, {
          credentials: "include"
        }),
        loadBookmarks()
      ]);

      if (!jobsResponse.ok) {
        throw new Error(
          `Failed to load jobs. HTTP ${jobsResponse.status}`
        );
      }

      const jobs = await jobsResponse.json();

      if (!Array.isArray(jobs)) {
        throw new Error("The jobs API did not return an array.");
      }

      allJobs = jobs;

      renderJobs(allJobs);

    } catch (err) {

      console.error("Error fetching jobs:", err);

      container.innerHTML =
        "<p class='no-ads'>Error loading jobs. Please try again later.</p>";

    }
  }

  loadJobs();


  // ============================================================
  // 4. SEARCH AND FILTER LOGIC
  // ============================================================

  function handleSearch() {

    // Existing search inputs
    const titleQuery = (titleInput?.value || "")
      .trim()
      .toLowerCase();

    const provinceQuery = (provinceInput?.value || "")
      .trim()
      .toLowerCase();

    // New company search
    const companyQuery = (companyInput?.value || "")
      .trim()
      .toLowerCase();

    // New industry filter
    const selectedIndustry = (industryFilter?.value || "")
      .trim()
      .toLowerCase();

    // New job type filter
    const selectedJobType = (jobTypeFilter?.value || "")
      .trim()
      .toLowerCase();

    // New salary range
    const minSalary = salaryMinFilter?.value
      ? Number(salaryMinFilter.value)
      : null;

    const maxSalary = salaryMaxFilter?.value
      ? Number(salaryMaxFilter.value)
      : null;


    // ----------------------------------------------------------
    // VALIDATE SALARY RANGE
    // ----------------------------------------------------------

    if (
      minSalary !== null &&
      maxSalary !== null &&
      minSalary > maxSalary
    ) {
      container.innerHTML = `
        <p class="no-ads">
          Minimum salary cannot exceed maximum salary.
        </p>
      `;
      return;
    }


    // ----------------------------------------------------------
    // FILTER JOBS
    // ----------------------------------------------------------

    const filteredJobs = allJobs.filter((job) => {

      const jobTitle = String(job.title || "").toLowerCase();

      const jobLocation = String(job.location || "").toLowerCase();

      const companyName = String(job.company_name || "").toLowerCase();

      const industry = String(job.industry || "").toLowerCase();

      const jobType = String(job.job_type || "")
        .trim()
        .toLowerCase();


      // A. Existing job title search
      if (!jobTitle.includes(titleQuery)) {
        return false;
      }


      // B. Existing province/location search
      if (!jobLocation.includes(provinceQuery)) {
        return false;
      }


      // C. Company name search
      if (!companyName.includes(companyQuery)) {
        return false;
      }


      // D. Industry filter
      if (
        selectedIndustry &&
        !industry.includes(selectedIndustry)
      ) {
        return false;
      }


      // E. Job type filter
      if (
        selectedJobType &&
        jobType !== selectedJobType
      ) {
        return false;
      }


      // F. Salary range filter
      const jobMin =
        job.salary_min !== null &&
        job.salary_min !== undefined &&
        job.salary_min !== ""
          ? Number(job.salary_min)
          : null;

      const jobMax =
        job.salary_max !== null &&
        job.salary_max !== undefined &&
        job.salary_max !== ""
          ? Number(job.salary_max)
          : null;

      const salaryFilterActive =
        minSalary !== null || maxSalary !== null;


      // Exclude jobs with missing or invalid salary data
      // when the user has selected a salary filter.
      if (salaryFilterActive) {

        if (
          jobMin === null ||
          jobMax === null ||
          !Number.isFinite(jobMin) ||
          !Number.isFinite(jobMax)
        ) {
          return false;
        }

        // The job's maximum must reach the selected minimum.
        if (
          minSalary !== null &&
          jobMax < minSalary
        ) {
          return false;
        }

        // The job's minimum must not exceed the selected maximum.
        if (
          maxSalary !== null &&
          jobMin > maxSalary
        ) {
          return false;
        }

      }

      // Job matches every active filter
      return true;

    });


    // Display the filtered results
    renderJobs(filteredJobs);

  }


  // ============================================================
  // 5. CONNECT SEARCH INPUTS AND FILTERS
  // ============================================================

  // Existing live job title search
  if (titleInput) {
    titleInput.addEventListener("input", handleSearch);
  }

  // Existing live province search
  if (provinceInput) {
    provinceInput.addEventListener("input", handleSearch);
  }

  // New live company search
  if (companyInput) {
    companyInput.addEventListener("input", handleSearch);
  }

  // New dropdown filters
  [
    industryFilter,
    jobTypeFilter,
    salaryMinFilter,
    salaryMaxFilter
  ].forEach((filter) => {

    if (filter) {
      filter.addEventListener("change", handleSearch);
    }

  });

  // Existing Search button
  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }


  // ============================================================
  // 6. CLEAR ALL SEARCHES AND FILTERS
  // ============================================================

  function clearSearch() {

    // Existing search inputs
    if (titleInput) titleInput.value = "";
    if (provinceInput) provinceInput.value = "";

    // New search and filter inputs
    if (companyInput) companyInput.value = "";
    if (industryFilter) industryFilter.value = "";
    if (jobTypeFilter) jobTypeFilter.value = "";
    if (salaryMinFilter) salaryMinFilter.value = "";
    if (salaryMaxFilter) salaryMaxFilter.value = "";

    // Restore every loaded job
    renderJobs(allJobs);

  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearSearch);
  }


  // ============================================================
  // 7. CAROUSEL
  // ============================================================

  if (nextBtn) {

    nextBtn.addEventListener("click", () => {

      container.scrollBy({
        left: 300,
        behavior: "smooth"
      });

    });

  }


  // ============================================================
  // 8. NOTIFICATION DROPDOWN
  // ============================================================

  const btn = document.querySelector(".notif-btn");
  const dropdown = document.getElementById("notifDropdown");

  if (btn && dropdown) {

    btn.addEventListener("click", () => {
      dropdown.classList.toggle("show");
    });

  }

  document.addEventListener("click", (e) => {

    if (
      btn &&
      dropdown &&
      !btn.contains(e.target) &&
      !dropdown.contains(e.target)
    ) {
      dropdown.classList.remove("show");
    }

  });

});
```
