document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("jobsContainer");
  const nextBtn = document.getElementById("nextBtn");
  
  // Inputs
  const titleInput = document.querySelector(".search-group input");
  const provinceInput = document.getElementById("provinceInput");
  const searchBtn = document.querySelector(".search-btn");

  let allJobs = []; 

  if (!container) return console.error("jobsContainer not found");

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

      card.innerHTML = `
          <h3>${job.title || "No title"}</h3>
          <p class="job-type">${job.job_type || "N/A"}</p>
          <p class="company-name">${job.company_name || "Company Name"}</p>
          <p class="location">${job.location || "Location"}</p>
          <p class="salary">${minSalary} - ${maxSalary}</p>
        `;

      card.addEventListener("click", () => {
        window.location.href = `view_joblist.html?id=${job.id}`;
      });

      container.appendChild(card);
    });
  }

  // --- 2. FETCH ---
  fetch("/api/jobpost/list")
    .then((res) => res.json())
    .then((jobs) => {
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

    // Show/Hide clear buttons based on input
    toggleClearBtn(titleInput);
    toggleClearBtn(provinceInput);

    const filteredJobs = allJobs.filter((job) => {
      const jobTitle = (job.title || "").toLowerCase();
      const jobLocation = (job.location || "").toLowerCase();
      return jobTitle.includes(titleQuery) && jobLocation.includes(provinceQuery);
    });

    renderJobs(filteredJobs);
  };

  // Helper to show/hide "X" button if you decide to add them to HTML later
  function toggleClearBtn(input) {
    if (!input) return;
    // This is optional logic if you want to add a physical 'X' icon later
  }

  // Clear function: Resets inputs and shows all jobs
  const clearSearch = () => {
    if(titleInput) titleInput.value = "";
    if(provinceInput) provinceInput.value = "";
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

  btn.addEventListener("click", () => {
    dropdown.classList.toggle("show");
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove("show");
    }
  });


});