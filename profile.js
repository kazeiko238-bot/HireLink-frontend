document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";

  const logoutBtn = document.getElementById("logoutBtn");
  const profileName = document.getElementById("profileName");
  const imageInput = document.getElementById("profileImageInput");
  const preview = document.getElementById("profilePreview");
  const profileImageUploadBtn = document.getElementById("uploadProfileBtn");
  const toggle = document.getElementById("profileToggle");
  const statusText = document.getElementById("visibilityStatus");
  const fileInput = document.getElementById("resumeInput");
  const uploadBtn = document.getElementById("uploadResumeBtn");
  const resumeBtn = document.getElementById("viewResumeBtn");
  const resumeViewer = document.getElementById("resumeViewer");
  const resumeFrame = document.getElementById("resumeFrame");

  let resumePath = null;
  let isResumeOpen = false;

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
    if (!file) { alert("Select an image first"); return; }
    const formData = new FormData();
    formData.append("profileImage", file);
    try {
      const res = await fetch(`${API_BASE}/api/profile/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      alert("Profile image updated!");
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
      const res = await fetch(`${API_BASE}/api/visibility/my`, { credentials: "include" });
      const data = await res.json();
      const isPublic = data.visibility === "public";
      if (toggle) toggle.checked = isPublic;
      if (statusText) statusText.textContent = isPublic ? "Your profile is Public" : "Your profile is Private";
    } catch (err) {
      console.error("Visibility load error:", err);
    }
  }

  loadVisibility();

  toggle?.addEventListener("change", async () => {
    const visibility = toggle.checked ? "public" : "private";
    await fetch(`${API_BASE}/api/visibility/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ visibility })
    });
    if (statusText) statusText.textContent = toggle.checked ? "Your profile is Public" : "Your profile is Private";
  });

  // =====================
  // LOAD PROFILE
  // =====================
  async function loadProfile() {
    try {
      const res = await fetch(`${API_BASE}/api/profile`, { credentials: "include" });
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
      console.log("Resume loaded:", resumePath ? "EXISTS" : "NONE");

      // Show view button only if resume exists
      if (resumeBtn) {
        resumeBtn.style.display = resumePath ? "inline-block" : "none";
      }

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
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      alert(result.success ? "Profile updated!" : result.error || "Error updating profile");
    } catch (err) {
      console.error(err);
    }
  });

  // =====================
  // RESUME UPLOAD
  // =====================
  uploadBtn?.addEventListener("click", async () => {
    console.log("UPLOAD BTN CLICKED");
    const file = fileInput?.files?.[0];
    if (!file) { alert("Select a resume file first"); return; }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await fetch(`${API_BASE}/api/resume/resume`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response:", data.success ? "SUCCESS" : data.error);

      if (!res.ok) throw new Error(data.error || "Upload failed");

      alert("Resume uploaded successfully!");
      resumePath = data.path;

      // Show view button after upload
      if (resumeBtn) resumeBtn.style.display = "inline-block";

    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message);
    }
  });

 // =====================
// VIEW / HIDE RESUME
// =====================
resumeBtn?.addEventListener("click", () => {
  if (!resumePath) { alert("No resume uploaded yet"); return; }

  if (resumePath.startsWith("data:")) {
    // Open base64 PDF directly in new tab
    const win = window.open();
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Resume</title></head>
      <body style="margin:0;padding:0;">
        <iframe src="${resumePath}" style="width:100vw;height:100vh;border:none;"></iframe>
      </body>
      </html>
    `);
  } else if (resumePath.startsWith("http")) {
    window.open(resumePath, "_blank");
  } else {
    window.open(`${API_BASE}${resumePath}`, "_blank");
  }
});
});
