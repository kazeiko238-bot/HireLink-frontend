document.addEventListener("DOMContentLoaded", () => {

const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  
  const container = document.getElementById("applicationContainer");

  async function loadMyApplications() {
    try {
      const res = await fetch("/api/application/my", {
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      container.innerHTML = "";

      data.forEach(app => {
        const row = document.createElement("div");
        row.className = "application-card";

        row.innerHTML = `
          <div class="top-row">
            <h3>${app.job_title}</h3>

            <div class="actions">
              <span class="status ${app.status}">
                ${app.status.toUpperCase()}
              </span>

              <button class="msg-btn">Message</button>
            </div>
          </div>

          <p class="company">${app.company_name}</p>

          <small class="date">
            Applied: ${new Date(app.applied_at).toLocaleString()}
          </small>
        `;

        // message button
       row.querySelector(".msg-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  console.log("app data:", app);           // see the full app object
  console.log("employer_user_id:", app.employer_user_id);  // is it undefined?
  openChat(app.employer_user_id);
});

        // optional click to view job
        row.addEventListener("click", () => {
          window.location.href = `/view_joblist.html?id=${app.job_id}`;
        });

        container.appendChild(row);
      });

    } catch (err) {
      console.error(err);
      container.innerHTML = "<p>Error loading applications</p>";
    }
  }

  async function openChat(otherUserId) {
  try {
    const res = await fetch("/api/chat/conversation/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ otherUserId })
    });

    const data = await res.json();

    if (!res.ok || !data.conversationId) {
      throw new Error(data.error || "Failed");
    }

    await fetch("/api/chat/context/set", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        otherUserId,
        jobId: null
      })
    });

    window.location.href = "/conversation.html";

  } catch (err) {
    console.error("openChat error:", err);
    alert("Failed to open chat");
  }
}


  loadMyApplications();
});
