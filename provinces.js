document.addEventListener("DOMContentLoaded", () => {

  const provinces = [
    "Abra","Agusan del Norte","Agusan del Sur","Aklan","Albay","Antique","Apayao",
    "Aurora","Basilan","Bataan","Batanes","Batangas","Benguet","Biliran","Bohol",
    "Bukidnon","Bulacan","Cagayan","Camarines Norte","Camarines Sur","Camiguin",
    "Capiz","Catanduanes","Cavite","Cebu","Cotabato","Davao del Norte",
    "Davao del Sur","Davao de Oro","Davao Oriental","Dinagat Islands",
    "Eastern Samar","Guimaras","Ifugao","Ilocos Norte","Ilocos Sur","Iloilo",
    "Isabela","Kalinga","La Union","Laguna","Lanao del Norte","Lanao del Sur",
    "Leyte","Maguindanao","Marinduque","Masbate","Metro Manila",
    "Misamis Occidental","Misamis Oriental","Mountain Province",
    "Negros Occidental","Negros Oriental","Northern Samar","Nueva Ecija",
    "Nueva Vizcaya","Occidental Mindoro","Oriental Mindoro","Palawan",
    "Pampanga","Pangasinan","Quezon","Quirino","Rizal","Romblon","Samar",
    "Sarangani","Siquijor","Sorsogon","South Cotabato","Southern Leyte",
    "Sultan Kudarat","Sulu","Surigao del Norte","Surigao del Sur",
    "Tarlac","Tawi-Tawi","Zambales","Zamboanga del Norte",
    "Zamboanga del Sur","Zamboanga Sibugay"
  ];

  provinces.sort();

  const input = document.getElementById("provinceInput");
  const list = document.getElementById("provinceList");
  const dropdown = document.getElementById("provinceDropdown");

  if (!input || !list || !dropdown) return;

  // Show the full list when the input is focused
  input.addEventListener("focus", () => {
    renderList(provinces);
    list.style.display = "block";
  });

  // Narrow the list while typing
  input.addEventListener("input", () => {
    const value = input.value.trim().toLowerCase();

    const filtered = provinces.filter((province) =>
      province.toLowerCase().startsWith(value)
    );

    renderList(filtered);
    list.style.display = filtered.length ? "block" : "none";
  });

  function renderList(items) {
    list.innerHTML = "";

    items.forEach((province) => {
      const li = document.createElement("li");
      li.textContent = province;

      li.addEventListener("click", () => {
        input.value = province;
        list.style.display = "none";

        // Setting .value in code does not fire any event, so tell
        // jobs.js that the province changed and let it filter right away.
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });

      list.appendChild(li);
    });
  }

  // Close the list when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) {
      list.style.display = "none";
    }
  });

});
