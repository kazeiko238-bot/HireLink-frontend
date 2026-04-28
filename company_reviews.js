document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  
  const reviewList = document.getElementById("reviewList");
  const avgBox = document.getElementById("avgRating");

  const starFilter = document.getElementById("filterStar");
  const dateFilter = document.getElementById("filterDate");

  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("id");

  let allReviews = [];

  // =========================
  // LOAD REVIEWS
  // =========================
  async function loadReviews() {
    try {
      const res = await fetch(`/api/review`, {
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      allReviews = data.reviews || [];

      avgBox.innerHTML = `
        ⭐ ${(data.avg_rating || 0).toFixed(1)} / 5
      `;

      applyFilters();

    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // FILTER LOGIC
  // =========================
  function applyFilters() {
    const starVal = starFilter.value;
    const dateVal = dateFilter.value;

    let filtered = [...allReviews];

    // ⭐ FILTER
    if (starVal !== "all") {
      filtered = filtered.filter(r => r.star_review == starVal);
    }

    // 📅 DATE FILTER
    const now = new Date();

    if (dateVal === "today") {
      filtered = filtered.filter(r => {
        const d = new Date(r.created_at);
        return d.toDateString() === now.toDateString();
      });
    }

    if (dateVal === "week") {
      filtered = filtered.filter(r => {
        const d = new Date(r.created_at);
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      });
    }

    if (dateVal === "month") {
      filtered = filtered.filter(r => {
        const d = new Date(r.created_at);
        return d.getMonth() === now.getMonth() &&
               d.getFullYear() === now.getFullYear();
      });
    }

    renderReviews(filtered);
  }

  // =========================
  // RENDER
  // =========================
  function renderReviews(reviews) {
    reviewList.innerHTML = "";

    if (reviews.length === 0) {
      reviewList.innerHTML = "<p>No reviews found.</p>";
      return;
    }

    reviews.forEach(r => {
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

        <div>${r.content}</div>
      `;

      reviewList.appendChild(div);
    });
  }

  // =========================
  // EVENTS
  // =========================
  starFilter.addEventListener("change", applyFilters);
  dateFilter.addEventListener("change", applyFilters);

  // INIT
  loadReviews();
});
