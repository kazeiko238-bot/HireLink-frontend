// -------- Back button --------
document.querySelector('.back-btn')?.addEventListener('click', () => {
  if (document.referrer) window.history.back();
  else window.location.href = '/';
});

const API_BASE = "https://hirelink-backend-qnww.onrender.com";

const input = document.getElementById("reviewInput");
  const starSelect = document.getElementById("starReview");
  const btn = document.getElementById("sendReviewBtn");
  const reviewContainer = document.getElementById("reviewContainer");
  const avgBox = document.getElementById("avgRating");



  const container = document.getElementById("jobsContainer");
  const nextBtn = document.getElementById("nextBtn");

// Get company id from URL
const params = new URLSearchParams(window.location.search);
const companyId = params.get("id");



  // ======================
  async function loadReviews() {
    try {
      const res = await fetch(`${API_BASE}/api/review/${companyId}`, {
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load reviews");

      const reviews = data.reviews || [];

      reviewContainer.innerHTML = "";

      avgBox.innerHTML = `
        <h3>⭐ ${(data.avg_rating || 0).toFixed(1)} / 5</h3>
      `;

      reviews.forEach(renderReview);

    } catch (err) {
      console.error("loadReviews error:", err);
    }
  }

  // ======================
  // RENDER SINGLE REVIEW
  // ======================
  function renderReview(r) {
    const div = document.createElement("div");
    div.className = "review-card";

    div.innerHTML = `
      <div class="review-meta">
        ${r.first_name || "User"} ${r.last_name || ""} • 
        ${new Date(r.created_at).toLocaleDateString()}
      </div>

      <div class="review-stars">
        ${"★".repeat(r.star_review)}${"☆".repeat(5 - r.star_review)}
      </div>

      <div class="review-content">
        ${r.content}
      </div>
    `;

    reviewContainer.appendChild(div);
  }

  // ======================
  // SEND REVIEW (PREPEND)
  // ======================
  btn.addEventListener("click", async () => {
    const content = input.value.trim();
    const star = parseInt(starSelect.value);

    if (!content) return alert("Write a review first");
    if (!star) return alert("Select star rating");

    try {
      const res = await fetch(`${API_BASE}/api/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          company_id: companyId,
          content,
          star_review: star
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post review");

      // ======================
      // INSTANT UI UPDATE
      // ======================
      const newReview = {
        first_name: "You",
        last_name: "",
        content,
        star_review: star,
        created_at: new Date()
      };

      const div = document.createElement("div");
      div.className = "review-card";

      div.innerHTML = `
        <div class="review-meta">
          You • just now
        </div>

        <div class="review-stars">
          ${"★".repeat(star)}${"☆".repeat(5 - star)}
        </div>

        <div class="review-content">
          ${content}
        </div>
      `;

      // 🔥 PREPEND (NEW FIRST)
      reviewContainer.prepend(div);

      // reset input
      input.value = "";
      starSelect.value = "5";



    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

 


async function loadProfile() {

  try {


    const res = await fetch(`${API_BASE}/api/companies`, {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Failed to load profile");

    const companies = await res.json();
    console.log("All companies:", companies);

    // Find selected company
    const data = companies.find(c => String(c.id) === companyId);

    if (!data) {
      console.error("Company not found");
      return;
    }

    console.log("Selected company:", data);

    // Populate fields
    document.getElementById("company_name").textContent = data.name || "";
    document.getElementById("industry").textContent = data.industry || "";
    document.getElementById("location").textContent = data.location || "";
     document.getElementById("description").textContent = data.description || "";
  } catch (err) {
    console.error("Error loading profile:", err);
  }

}

loadProfile();


loadReviews();

fetch(`${API_BASE}/api/companies/jobs?id=${companyId}`, {
  method: "GET",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
})
    .then(async res => {
      if (!res.ok) {
        let errData = {};
        try { errData = await res.json(); } catch {}
        throw new Error(errData.error || "Failed to fetch jobs");
      }
      return res.json();
    })
   
.then(jobs => {
  console.log("API RESPONSE:", jobs);
      container.innerHTML = "";

      if (!Array.isArray(jobs) || jobs.length === 0) {
        container.innerHTML = "<p>No job ads found.</p>";
        return;
      }

      jobs.forEach(job => {

        const minSalary = job.salary_min 
          ? `₱${Number(job.salary_min).toLocaleString()}` 
          : "N/A";

        const maxSalary = job.salary_max 
          ? `₱${Number(job.salary_max).toLocaleString()}` 
          : "N/A";

        // Optional icon logic
        let icon = "📋";
        if (job.title?.toLowerCase().includes("developer")) icon = "&lt;/&gt;";
        if (job.title?.toLowerCase().includes("designer")) icon = "▤";

        const card = document.createElement("div");
        card.classList.add("job-card-block");

        card.innerHTML = `
          <div class="icon-circle">${icon}</div>
          
          <div class="card-content">
              <h3>${job.title || "No title"}</h3>
              <p>
                ${job.location || "N/A"} • 
                ${job.job_type || "N/A"} • 
                ${minSalary} - ${maxSalary}
              </p>
              <p class="description-subtext">
                ${job.description || "No description available."}
              </p>
          </div>

          <button class="btn-gradient">Apply Now</button>
        `;

        // Click whole card → view page
        card.addEventListener("click", () => {
          window.location.href = `view_joblist.html?id=${job.id}`;
        });

        container.appendChild(card);
      });

    })
    .catch(err => {
      console.error("Error fetching job posts:", err);
      container.innerHTML = `<p>${err.message}</p>`;
    });

  // Scroll carousel
  nextBtn.addEventListener("click", () => {
    container.scrollBy({ left: 320, behavior: "smooth" });
  });

