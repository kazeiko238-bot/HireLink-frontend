document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  
  const dashboard = document.querySelector(".dashboard-content");
  const postJobBtn = document.querySelector("#postJob");
  const cancelBtn = document.querySelector("#cancel");
  const submitBtn = document.querySelector("#post");

  const container = document.getElementById("jobsContainer");
  const nextBtn = document.getElementById("nextBtn");

  const dashboardInputs = dashboard.querySelectorAll("input, textarea");

  function checkFields() {
    let allFilled = true;
    dashboardInputs.forEach(input => {
      if (!input.value.trim()) allFilled = false;
    });
    submitBtn.disabled = !allFilled;
  }

  // =====================
  // OPEN POST FORM
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
  // POST JOB
  // =====================
  submitBtn?.addEventListener("click", async () => {
    const jobData = {
      title: document.getElementById("jobtitleInput").value.trim(),
      description: document.getElementById("jobdescriptionInput").value.trim(),
      salary_min: parseInt(document.getElementById("salaryminInput").value.trim()),
      salary_max: parseInt(document.getElementById("salarymaxInput").value.trim()),
      location: document.getElementById("joblocationInput").value.trim(),
      job_type: document.getElementById("jobtypeInput").value.trim(),
      contact_no: document.getElementById("contactInput").value.trim(),
      email: document.getElementById("emailInput").value.trim()
    };

    try {
      const res = await fetch(`${API_BASE}/api/jobpost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(jobData)
      });

      const data = await res.json();
      if (!res.ok) return alert(data.error || "Failed to post job");

      alert("Job posted successfully!");

      dashboard.style.display = "none";
      postJobBtn.style.display = "inline-block";
      dashboardInputs.forEach(input => input.value = "");
      submitBtn.disabled = true;

      loadJobs(); // refresh list

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  });

  // =====================
  // LOAD JOBS (FIXED)
  // =====================
  async function loadJobs() {
    try {
      const res = await fetch(`${API_BASE}/api/jobpost`, {
        method: "GET",
        credentials: "include",
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

        // IMPORTANT: include is_active in dataset
        card.dataset.id = job.id;
        card.dataset.active = job.is_active;

        const minSalary = job.salary_min
          ? `₱${Number(job.salary_min).toLocaleString()}`
          : "N/A";

        const maxSalary = job.salary_max
          ? `₱${Number(job.salary_max).toLocaleString()}`
          : "N/A";

        card.innerHTML = `
          <h3>${job.title || "No title"}</h3>
          <p class="job-type">${job.job_type || "N/A"}</p>
          <p class="salary">${minSalary} - ${maxSalary}</p>
        `;

        // CLICK → VIEW JOB
        card.addEventListener("click", () => {
          window.location.href = `view_joblist.html?id=${job.id}`;
        });

        container.appendChild(card);
      });

    } catch (err) {
      console.error("Error fetching job posts:", err);
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
