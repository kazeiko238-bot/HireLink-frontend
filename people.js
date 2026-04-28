document.addEventListener("DOMContentLoaded", async () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  
  const container = document.getElementById("peopleContainer");

  const profileSearchInput = document.getElementById("profileSearchInput");
  const provinceInput = document.getElementById("provinceInput");
  const searchBtn = document.querySelector(".search-btn");

  let allPeople = [];
  let currentUser = null;

  if (!container) return console.error("peopleContainer not found");

  // =========================
  // GET LOGGED IN USER
  // =========================
  try {
    const res = await fetch(`${API_BASE}/api/me`, { credentials: "include" });
    if (res.ok) {
      currentUser = await res.json(); // expects { userId, role }
    }
  } catch (err) {
    console.error("Failed to get user:", err);
  }

  // =========================
  // RENDER
  // =========================
  function renderPeople(list) {
    container.innerHTML = "";

    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = "<p class='no-ads'>No jobseekers found matching your search.</p>";
      return;
    }

    list.forEach((user) => {
      const card = document.createElement("div");
      card.classList.add("person-card");

      card.innerHTML = `
        <img src="${user.logo || 'images/avatar.png'}" class="logo">
        <h3>${user.name || "Anonymous"}</h3>
        <p class="profession">${user.profession || "No Profession Listed"}</p>
        <span class="job-badge">${user.current || "Open to Work"}</span>
        <p class="location-text"><small>${user.location || ""}</small></p>
      `;

      card.addEventListener("click", () => {
        window.location.href = `view_jobseeker.html?id=${user.id}`;
      });

      container.appendChild(card);
    });
  }

  // =========================
  // FETCH JOBSEEKERS
  // =========================
  fetch(`${API_BASE}/api/jobseekers`, { credentials: "include" })
    .then(res => res.json())
    .then(users => {

      const myUserId = currentUser?.userId;

      // 🔥 IMPORTANT FIX: remove logged-in user's own card
      allPeople = users.filter(user => {
        return String(user.user_id || user.id) !== String(myUserId);
      });

      renderPeople(allPeople);
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = "<p>Error loading users.</p>";
    });

  // =========================
  // SEARCH
  // =========================
  function handleSearch() {
    const searchQuery = profileSearchInput?.value.toLowerCase().trim() || "";
    const provinceQuery = provinceInput?.value.toLowerCase().trim() || "";

    const filtered = allPeople.filter(user => {
      const name = (user.name || "").toLowerCase();
      const profession = (user.profession || "").toLowerCase();
      const location = (user.location || "").toLowerCase();

      return (
        (name.includes(searchQuery) || profession.includes(searchQuery)) &&
        location.includes(provinceQuery)
      );
    });

    renderPeople(filtered);
  }

  profileSearchInput?.addEventListener("input", handleSearch);
  provinceInput?.addEventListener("input", handleSearch);
  searchBtn?.addEventListener("click", handleSearch);
});
