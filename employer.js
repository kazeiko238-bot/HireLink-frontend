document.addEventListener("DOMContentLoaded", () => {
  
const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  
  const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("userName");
      localStorage.removeItem("userRole");
      window.location.href = "index-company.html";
    });
  
   const storedName = localStorage.getItem("userName");

  const profileName = document.getElementById("profileName");
  const companyNameinput = document.getElementById("companyNameinput");

  if (storedName) {
    if (profileName) {
      profileName.textContent = storedName;
    }

    if (companyNameinput) {
      companyNameinput.value = storedName; // ← this fills the input
    }
  }

  const imageInput = document.getElementById("profileImageInput");
  const preview = document.getElementById("profilePreview");


  /* Profile Image Preview */
  if (imageInput) {
    imageInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }


const tabs = document.querySelectorAll('.tab');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove 'active' class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Add 'active' class to the clicked tab
        tab.classList.add('active');

        // Get the target section ID
        const targetId = tab.getAttribute('data-target');
        const targetSection = document.getElementById(targetId);

        // Scroll smoothly to the section
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});
document.querySelector('.back-btn').addEventListener('click', () => {
    // Go back to previous page in history
    if (document.referrer) {
        window.history.back();
    } else {
        // fallback: go to homepage if no referrer
        window.location.href = '/';
    }
});

async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/profile/company`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      console.log("Profile data:", data);

      // Populate form fields
      document.getElementById("companyNameinput").value = data.company_name || "";
      document.getElementById("emailInput").value = data.company_email || "";
      document.getElementById("industryInput").value = data.industry || "";
      document.getElementById("introductionInput").value = data.description || "";
      document.getElementById("locationInput").value = data.location || "";
      document.getElementById("companysizeInput").value = data.company_size || "";
      
      document.getElementById("location").textContent = data.location || "";
      document.getElementById("industry").textContent = data.industry || "";
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }
  loadProfile();

  // -------- Update Button --------
  document.getElementById("updateBtn")?.addEventListener("click", async () => {
    const payload = {
    company_name: document.getElementById("companyNameinput").value,
    company_email: document.getElementById("emailInput").value,
    industry: document.getElementById("industryInput").value,
    description: document.getElementById("introductionInput").value,
    location: document.getElementById("locationInput").value,
    company_size: document.getElementById("companysizeInput").value

    };

    try {
      const res = await fetch(`${API_BASE}/api/profile/company`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include" ,
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      alert(result.success ? "Profile updated!" : result.error || "Error updating profile");
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  });

});
