document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";

  const logoutBtn = document.getElementById("logoutBtn");
  const profileName = document.getElementById("profileName");

  const imageInput = document.getElementById("profileImageInput");
  const preview = document.getElementById("profilePreview");

  const toggle = document.getElementById("profileToggle");
  const statusText = document.getElementById("visibilityStatus");

  const tabs = document.querySelectorAll(".tab");
  const cards = document.querySelectorAll(".main-panel .card");

  const fileInput = document.getElementById("resumeInput");
  const uploadBtn = document.getElementById("uploadResumeBtn");

  const resumeBtn = document.getElementById("viewResumeBtn");
  const resumeViewer = document.getElementById("resumeViewer");
  const resumeFrame = document.getElementById("resumeFrame");

  const profileImageUploadBtn = document.getElementById("uploadProfileBtn");

  let resumePath = null;
  let profileImagePath = null;

  // =====================
  // LOGOUT
  // =====================
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    window.location.href = "index-jobseeker.html";
  });

  // =====================
  // PROFILE NAME
  // =====================
  const storedName = localStorage.getItem("userName");
  if (storedName && profileName) profileName.textContent = storedName;

  // =====================
  // IMAGE PREVIEW
  // =====================
  imageInput?.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => preview.src = e.target.result;
    reader.readAsDataURL(file);
  });

  // =====================
  // UPLOAD PROFILE IMAGE
  // =====================
  profileImageUploadBtn?.addEventListener("click", async () => {

    const file = imageInput?.files?.[0];

    if (!file) {
      alert("Select an image first");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      const res = await fetch(`${API_BASE}/api/profile/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server did not return JSON: " + text);
      }

      if (!res.ok) throw new Error(data.error || "Upload failed");

      alert("Profile image updated!");
      profileImagePath = data.path;

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // =====================
  // VISIBILITY
  // =====================
  async function loadVisibility() {
    try {
      const res = await fetch(`${API_BASE}/api/visibility/my`);
      const data = await res.json();

      const isPublic = data.visibility === "public";
      toggle.checked = isPublic;

      statusText.textContent = isPublic
        ? "Your profile is Public"
        : "Your profile is Private";

    } catch (err) {
      console.error(err);
    }
  }
  loadVisibility();

  toggle?.addEventListener("change", async () => {
    const visibility = toggle.checked ? "public" : "private";

    await fetch(`${API_BASE}/api/visibility/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ visibility }),
    });

    statusText.textContent = toggle.checked
      ? "Your profile is Public"
      : "Your profile is Private";
  });

  // =====================
  // LOAD PROFILE
  // =====================
  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        credentials: "include"
      });

      const data = await res.json();

      document.getElementById("firstNameinput").value = data.first_name || "";
      document.getElementById("middleNameinput").value = data.middle_name || "";
      document.getElementById("lastNameInput").value = data.last_name || "";
      document.getElementById("suffixNameInput").value = data.suffix || "";
      document.getElementById("professionInput").value = data.profession || "";
      document.getElementById("contactInput").value = data.contact_number || "";
      document.getElementById("emailInput").value = data.email || "";
      document.getElementById("jobpositionInput").value = data.job_position || "";
      document.getElementById("currentcompanyInput").value = data.current_company || "";
      document.getElementById("graduatedatInput").value = data.graduated_at || "";
      document.getElementById("locationInput").value = data.location || "";
      document.getElementById("bioInput").value = data.bio || "";
      document.getElementById("expectedsalaryInput").value = data.expected_salary || "";

      resumePath = data.resume || null;

    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }

  loadProfile();

  // =====================
  // UPDATE PROFILE
  // =====================
  document.getElementById("updateBtn")?.addEventListener("click", async () => {

    const payload = {
      first_name: document.getElementById("firstNameinput").value,
      middle_name: document.getElementById("middleNameinput").value,
      last_name: document.getElementById("lastNameInput").value,
      suffix: document.getElementById("suffixNameInput").value,
      profession: document.getElementById("professionInput").value,
      contact_number: document.getElementById("contactInput").value,
      email: document.getElementById("emailInput").value,
      job_position: document.getElementById("jobpositionInput").value,
      current_company: document.getElementById("currentcompanyInput").value,
      graduated_at: document.getElementById("graduatedatInput").value,
      location: document.getElementById("locationInput").value,
      bio: document.getElementById("bioInput").value,
      expected_salary: document.getElementById("expectedsalaryInput").value
    };

    try {
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      alert(result.success ? "Profile updated!" : result.error || "Error updating profile");

    } catch (err) {
      console.error(err);
    }
  });

  // =====================
  // RESUME UPLOAD (FIXED)
  // =====================
  uploadBtn?.addEventListener("click", async () => {

    const file = fileInput?.files?.[0];

    if (!file) {
      alert("Select a resume file first");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch(`${API_BASE}/api/resume/resume`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server did not return JSON: " + text);
      }

      if (!res.ok) throw new Error(data.error || "Upload failed");

      alert("Resume uploaded successfully!");

      resumePath = data.path || data.resume;

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // =====================
  // VIEW RESUME
  // =====================
  resumeBtn?.addEventListener("click", () => {

    if (!resumePath) {
      alert("No resume uploaded");
      return;
    }

    resumeViewer.classList.remove("hidden");
    resumeFrame.src = resumePath + "#toolbar=0";
  });

});
