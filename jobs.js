
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://hirelink-backend-qnww.onrender.com";

  const $ = id => document.getElementById(id);
  const container = $("jobsContainer");
  const resultsCount = $("resultsCount");
  const titleInput = $("jobSearchInput");
  const provinceInput = $("provinceInput");
  const companyInput = $("companySearchInput");
  const industryFilter = $("industryFilter");
  const jobTypeFilter = $("jobTypeFilter");
  const salaryMinFilter = $("salaryMinFilter");
  const salaryMaxFilter = $("salaryMaxFilter");
  const clearFiltersBtn = $("clearFiltersBtn");
  const searchBtn = document.querySelector(".search-btn");

  let allJobs = [];
  let bookmarkedIds = new Set();
  let searchTimer;

  if (!container) return;

  const normalize = value => String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);

  function parseSalary(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(String(value).replace(/[₱,\s]/g, ""));
    return Number.isFinite(number) ? number : null;
  }

  function formatSalary(value) {
    const number = parseSalary(value);
    return number === null ? null : `₱${number.toLocaleString("en-PH")}`;
  }

  function getCompany(job) {
    return job.company_name ?? job.companyName ??
      job.company?.company_name ?? job.company?.name ?? "Company Name";
  }

  function getIndustry(job) {
    return job.industry ?? job.company_industry ??
      job.companyIndustry ?? job.company?.industry ?? "";
  }

  function getId(job) {
    return String(job.id ?? job.job_id ?? "");
  }

  function industryMatches(actualValue, selectedValue) {
    if (!selectedValue) return true;

    const actual = normalize(actualValue);
    const selected = normalize(selectedValue);

    if (!actual) return false;
    if (actual === selected || actual.includes(selected)) return true;

    const aliases = {
      informationtechnology: ["technology", "it", "ict"],
      healthcare: ["health", "medical"],
      education: ["educational"],
      finance: ["financeaccounting", "accounting", "banking"],
      engineering: ["engineeringconstruction", "construction"],
      marketing: ["marketingadvertising", "advertising"],
      bpo: ["customerservice", "customersupport", "callcenter"],
      manufacturing: ["production"],
      retail: ["retailsales", "sales"],
      hospitality: ["hospitalitytourism", "tourism", "hotel", "restaurant"],
      telecommunication: ["telecommunications", "telecom"],
      wine: ["winebeverage", "beverage", "winery"]
    };

    return (aliases[selected] || []).some(alias => {
      const normalizedAlias = normalize(alias);
      return actual === normalizedAlias || actual.includes(normalizedAlias);
    });
  }

  async function loadBookmarks() {
    try {
      const response = await fetch(`${API_BASE}/api/bookmarks/my`, {
        credentials: "include"
      });

      if (!response.ok) return;

      const data = await response.json();

      if (Array.isArray(data)) {
        bookmarkedIds = new Set(data.map(item =>
          String(typeof item === "object"
            ? item.job_id ?? item.id
            : item)
        ));
      }
    } catch (error) {
      console.warn("Could not load bookmarks:", error);
    }
  }

  function renderJobs(jobs) {
    container.innerHTML = "";

    if (resultsCount) {
      resultsCount.textContent =
        `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"} found`;
    }

    if (!jobs.length) {
      const empty = document.createElement("p");
      empty.className = "no-ads";
      empty.textContent = "No jobs match your search. Try changing or clearing your filters.";
      container.appendChild(empty);
      return;
    }

    jobs.forEach(job => {
      const id = getId(job);
      const title = String(job.title ?? "Untitled Position");
      const company = getCompany(job);
      const location = String(job.location ?? "Location not specified");
      const type = String(job.job_type ?? job.jobType ?? "Not specified");
      const industry = String(getIndustry(job) || "Career opportunity");

      const min = parseSalary(job.salary_min);
      const max = parseSalary(job.salary_max);

      let salary = "Salary not specified";

      if (min !== null && max !== null) {
        salary = `${formatSalary(min)} – ${formatSalary(max)}`;
      } else if (min !== null) {
        salary = `From ${formatSalary(min)}`;
      } else if (max !== null) {
        salary = `Up to ${formatSalary(max)}`;
      }

      const saved = bookmarkedIds.has(id);
      const card = document.createElement("article");
      card.className = "jobs-card";
      card.tabIndex = 0;
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", `View ${title} at ${company}`);

      card.innerHTML = `
        <button class="bookmark-btn ${saved ? "active" : ""}"
          type="button" aria-label="${saved ? "Remove bookmark" : "Bookmark job"}"
          aria-pressed="${saved}">
          ${saved ? "★" : "☆"}
        </button>
        <div class="job-card-top">
          <span class="job-type">${escapeHTML(type)}</span>
          <span class="job-industry">${escapeHTML(industry)}</span>
        </div>
        <h3>${escapeHTML(title)}</h3>
        <p class="company-name">${escapeHTML(company)}</p>
        <p class="location"><span aria-hidden="true">⌖</span> ${escapeHTML(location)}</p>
        <p class="salary">${escapeHTML(salary)}</p>
        <div class="job-card-footer">
          <span>View job details</span><span aria-hidden="true">→</span>
        </div>
      `;

      const bookmarkBtn = card.querySelector(".bookmark-btn");

      bookmarkBtn.addEventListener("click", async event => {
        event.stopPropagation();

        const toggleBookmark = async () => {
          bookmarkBtn.disabled = true;

          try {
            const response = await fetch(`${API_BASE}/api/bookmarks/toggle`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ job_id: job.id ?? job.job_id })
            });

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Could not update bookmark.");
            }

            if (data.bookmarked) bookmarkedIds.add(id);
            else bookmarkedIds.delete(id);

            bookmarkBtn.textContent = data.bookmarked ? "★" : "☆";
            bookmarkBtn.classList.toggle("active", Boolean(data.bookmarked));
            bookmarkBtn.setAttribute("aria-pressed", String(Boolean(data.bookmarked)));
            bookmarkBtn.setAttribute("aria-label",
              data.bookmarked ? "Remove bookmark" : "Bookmark job");
          } catch (error) {
            console.error("Bookmark error:", error);
            alert(error.message);
          } finally {
            bookmarkBtn.disabled = false;
          }
        };

        if (typeof window.requireAuth === "function") {
          if (window.requireAuth(toggleBookmark)) await toggleBookmark();
        } else if (localStorage.getItem("userName")) {
          await toggleBookmark();
        } else {
          $("loginOverlay")?.classList.remove("hidden");
        }
      });

      function openJob() {
        if (!id) {
          console.error("Job has no ID:", job);
          return;
        }

        const proceed = () => {
          window.location.href = `view_joblist.html?id=${encodeURIComponent(id)}`;
        };

        if (typeof window.requireAuth === "function") {
          if (window.requireAuth(proceed)) proceed();
        } else if (localStorage.getItem("userName")) {
          proceed();
        } else {
          $("loginOverlay")?.classList.remove("hidden");
        }
      }

      card.addEventListener("click", event => {
        if (!event.target.closest(".bookmark-btn")) openJob();
      });

      card.addEventListener("keydown", event => {
        if (event.target !== card) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openJob();
        }
      });

      container.appendChild(card);
    });
  }

  function handleSearch() {
    const title = normalize(titleInput?.value);
    const province = normalize(provinceInput?.value);
    const company = normalize(companyInput?.value);
    const industry = industryFilter?.value || "";
    const type = normalize(jobTypeFilter?.value);

    const minSalary = salaryMinFilter?.value
      ? Number(salaryMinFilter.value) : null;
    const maxSalary = salaryMaxFilter?.value
      ? Number(salaryMaxFilter.value) : null;

    if (minSalary !== null && maxSalary !== null && minSalary > maxSalary) {
      renderJobs([]);
      const message = container.querySelector(".no-ads");
      if (message) message.textContent =
        "Minimum salary cannot exceed maximum salary.";
      if (resultsCount) resultsCount.textContent = "Invalid salary range";
      return;
    }

    const filtered = allJobs.filter(job => {
      if (title && !normalize(job.title).includes(title)) return false;
      if (province && !normalize(job.location).includes(province)) return false;
      if (company && !normalize(getCompany(job)).includes(company)) return false;
      if (!industryMatches(getIndustry(job), industry)) return false;

      if (type && normalize(job.job_type ?? job.jobType) !== type) return false;

      const jobMin = parseSalary(job.salary_min);
      const jobMax = parseSalary(job.salary_max);

      if (minSalary !== null || maxSalary !== null) {
        if (jobMin === null && jobMax === null) return false;

        const lowest = jobMin ?? jobMax;
        const highest = jobMax ?? jobMin;

        if (minSalary !== null && highest < minSalary) return false;
        if (maxSalary !== null && lowest > maxSalary) return false;
      }

      return true;
    });

    renderJobs(filtered);
  }

  function scheduleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(handleSearch, 180);
  }

  [titleInput, provinceInput, companyInput].forEach(input => {
    input?.addEventListener("input", scheduleSearch);
    input?.addEventListener("change", handleSearch);
    input?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSearch();
      }
    });
  });

  [industryFilter, jobTypeFilter, salaryMinFilter, salaryMaxFilter].forEach(
    filter => filter?.addEventListener("change", handleSearch)
  );

  searchBtn?.addEventListener("click", handleSearch);

  clearFiltersBtn?.addEventListener("click", () => {
    clearTimeout(searchTimer);

    [
      titleInput, provinceInput, companyInput,
      industryFilter, jobTypeFilter, salaryMinFilter, salaryMaxFilter
    ].forEach(input => {
      if (input) input.value = "";
    });

    provinceInput?.dispatchEvent(new Event("change", { bubbles: true }));
    handleSearch();
  });

  async function loadJobs() {
    container.innerHTML = '<p class="no-ads">Loading available jobs...</p>';

    try {
      await loadBookmarks();

      const response = await fetch(`${API_BASE}/api/jobpost/list`, {
        credentials: "include"
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The jobs API did not return an array.");
      }

      allJobs = data;
      handleSearch();
    } catch (error) {
      console.error("Error loading jobs:", error);
      container.innerHTML = "";

      const message = document.createElement("p");
      message.className = "no-ads";
      message.textContent = "Unable to load jobs. Please refresh and try again.";
      container.appendChild(message);

      if (resultsCount) resultsCount.textContent = "Could not load jobs";
    }
  }

  loadJobs();
});
