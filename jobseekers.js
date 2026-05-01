document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  
  const container = document.getElementById("jobseekersContainer");

  if (!container) {
    console.error("jobseekersContainer not found in HTML");
    return;
  }

fetch(`${API_BASE}/api/jobseekers`, {
  credentials: "include"
})
    .then(res => {
      if (!res.ok) {
        throw new Error("Failed to fetch jobseekers");
      }
      return res.json();
    })
    .then(jobseekers => {

      console.log("Jobseekers:", jobseekers);

      container.innerHTML = "";

      if (!jobseekers.length) {
        container.innerHTML = "<p>No jobseekers found.</p>";
        return;
      }

      jobseekers.forEach(jobseeker => {

        const card = document.createElement("div");
        card.classList.add("jobseekers-card");

        card.innerHTML = `
          <img src="${jobseeker.logo || 'images/avatar.png'}" alt="Logo" class="logo">
          <h3>${jobseeker.name || ""}</h3>
          <h3>${jobseeker.profession || ""}</h3>
          <span class="job-badge">${jobseeker.current || ""}</span>
        `;

        // Go to jobseeker profile
        card.addEventListener("click", () => {
          window.location.href = `view_jobseeker.html?id=${jobseeker.id}`;
        });

        container.appendChild(card);

      });

    })
    .catch(err => {
      console.error("Error loading jobseekers:", err);
      container.innerHTML = "<p>Error loading jobseekers.</p>";
    });

});
