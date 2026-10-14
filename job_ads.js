document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";

  const isLoggedIn = !!localStorage.getItem("userName");
  if (!isLoggedIn) {
    if (typeof window.requireAuth === "function") {
      window.requireAuth(() => window.location.reload());
    }
    return;
  }

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
        console.error("JOB POST ERROR:", res.status, data);
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

  // Shows a message in the jobs container without using innerHTML.
  function showMessage(text) {
    container.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = text;
    container.appendChild(p);
  }

  async function loadJobs() {
    try {
      const res = await fetch(`${API_BASE}/api/jobpost`, {
        method: "GET",
        credentials: "include"
      });

      const jobs = await res.json();

      // Show the real reason instead of "No job ads found".
      if (!res.ok) {
        console.error("LOAD JOBS ERROR:", res.status, jobs);

        if (res.status === 401) {
          showMessage("Your session has expired. Please log out and log in again.");
        } else if (res.status === 404) {
          showMessage("No company profile is linked to this account.");
        } else {
          showMessage(jobs.error || "Failed to load jobs.");
        }
        return;
      }

      console.log("Company job posts:", jobs);

      container.innerHTML = "";

      if (!Array.isArray(jobs) || jobs.length === 0) {
        showMessage("No job ads found.");
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

        const title = document.createElement("h3");
        title.textContent = job.title || "No title";

        const type = document.createElement("p");
        type.className = "job-type";
        type.textContent = job.job_type || "N/A";

        const salary = document.createElement("p");
        salary.className = "salary";
        salary.textContent = `${minSalary} - ${maxSalary}`;

        card.append(title, type, salary);

        card.addEventListener("click", () => {
          window.location.href = `view_joblist.html?id=${encodeURIComponent(job.id)}`;
        });

        container.appendChild(card);
      });

    } catch (err) {
      console.error("LOAD JOBS ERROR:", err);
      showMessage("Failed to load jobs.");
    }
  }

  nextBtn?.addEventListener("click", () => {
    container.scrollBy({ left: 300, behavior: "smooth" });
  });

  loadJobs();
});
