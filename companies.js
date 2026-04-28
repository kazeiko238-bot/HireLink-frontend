document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  
  const container = document.getElementById("companiesContainer");
  const nextBtn = document.getElementById("nextBtn");
  
  // Select the search inputs
  const companySearchInput = document.getElementById("companySearchInput");
  const provinceInput = document.getElementById("provinceInput");
  const searchBtn = document.querySelector(".search-btn");

  let allCompanies = []; // Master list to store fetched data

  if (!container) {
    console.error("companiesContainer not found in HTML");
    return;
  }

  // --- 1. THE RENDERER ---
  function renderCompanies(companiesToDisplay) {
    container.innerHTML = "";

    if (!Array.isArray(companiesToDisplay) || companiesToDisplay.length === 0) {
      container.innerHTML = "<p class='no-ads'>No companies found matching your search.</p>";
      return;
    }

    companiesToDisplay.forEach((company) => {
      const card = document.createElement("div");
      card.classList.add("company-card");

      card.innerHTML = `
          <img src="${company.logo || 'images/avatar.png'}" alt="Logo" class="logo">
          <h3>${company.name || "Unknown Company"}</h3>
          <span class="job-badge">${company.openJobs || 0} Jobs</span>
          <p class="location-text"><small>${company.location || ""}</small></p>
        `;

      // Go to company profile
      card.addEventListener("click", () => {
        window.location.href = `view_company.html?id=${company.id}`;
      });

      container.appendChild(card);
    });
  }

  // --- 2. INITIAL FETCH ---
  fetch(`${API_BASE}/api/companies`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    })
    .then((companies) => {
      allCompanies = companies; // Save the full list
      renderCompanies(allCompanies); // Show all on load
    })
    .catch((err) => {
      console.error("Error loading companies:", err);
      container.innerHTML = "<p>Error loading companies.</p>";
    });

  // --- 3. LIVE SEARCH LOGIC ---
  const handleSearch = () => {
    const searchQuery = companySearchInput ? companySearchInput.value.toLowerCase().trim() : "";
    const provinceQuery = provinceInput ? provinceInput.value.toLowerCase().trim() : "";

    const filteredCompanies = allCompanies.filter((company) => {
      const name = (company.name || "").toLowerCase();
      const location = (company.location || "").toLowerCase();

      const matchesSearch = name.includes(searchQuery);
      const matchesProvince = location.includes(provinceQuery);

      return matchesSearch && matchesProvince;
    });

    renderCompanies(filteredCompanies);
  };

  // Attach "Live" listeners
  if (companySearchInput) {
    companySearchInput.addEventListener("input", handleSearch);
    companySearchInput.addEventListener("search", handleSearch); // Resets when 'X' is clicked
  }
  
  if (provinceInput) {
    provinceInput.addEventListener("input", handleSearch);
    provinceInput.addEventListener("search", handleSearch);
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", handleSearch);
  }

  // --- 4. CAROUSEL SCROLL ---
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      container.scrollBy({ left: 300, behavior: "smooth" });
    });
  }
});
