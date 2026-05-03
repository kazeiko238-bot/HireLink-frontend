document.addEventListener("DOMContentLoaded", () => {

  const footerArea = document.getElementById("footer-user-area");

  if (!footerArea) return;

  const name = localStorage.getItem("userName");
  const role = localStorage.getItem("userRole");

  // NOT LOGGED IN
  if (!name || !role) {
    footerArea.innerHTML = `
      <p style="font-size: 13px; color: gray;">
        Not logged in
      </p>
      <a href="index-jobseeker.html">Login</a>
    `;
    return;
  }

  // LOGGED IN
  footerArea.innerHTML = `
    <p style="font-size: 13px;">
      Logged in as <strong>${name}</strong> (${role})
    </p>

    ${
      role === "employer"
        ? `<a href="employer-dashboard.html">Dashboard</a>`
        : `<a href="profile.html">My Profile</a>`
    }

    <button id="footerLogoutBtn" style="margin-top:5px;">Logout</button>
  `;

  // LOGOUT HANDLER
  document.getElementById("footerLogoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    window.location.href = "index-jobseeker.html";
  });

});
