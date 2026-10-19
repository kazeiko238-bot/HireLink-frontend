document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://hirelink-backend-qnww.onrender.com";

    const container = document.getElementById("applicationContainer");

    const overlay = document.getElementById("viewInterviewOverlay");

    function formatTime(time) {
    const [hour, minute] = time.split(":");

    return new Date(0, 0, 0, hour, minute).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}

    // ===============================
    // Load My Applications
    // ===============================
    async function loadMyApplications() {

        try {

            const res = await fetch(`${API_BASE}/api/application/my`, {
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

                            <button class="msg-btn">
                                Message
                            </button>

                        </div>

                    </div>

                    <p class="company">
                        ${app.company_name}
                    </p>

                    <small class="date">
                        Applied:
                        ${new Date(app.applied_at).toLocaleString()}
                    </small>

                    ${
                        app.interview_id
                        ? `
                        <div class="interview-notice">

                            <div class="interview-icon">
                                📅
                            </div>

                            <div class="interview-info">

                                <div class="interview-title">
                                    Interview Invitation
                                </div>

                                <div class="interview-subtitle">
                                    ${app.company_name} scheduled an interview for you.
                                </div>

                            </div>

                            <button class="view-interview-btn">
                                View
                            </button>

                        </div>
                        `
                        : ""
                    }
                `;

                // ==========================
                // Message Employer
                // ==========================

                row.querySelector(".msg-btn").addEventListener("click", (e) => {

                    e.stopPropagation();

                    openChat(app.employer_user_id);

                });

                // ==========================
                // View Interview
                // ==========================

                const viewBtn = row.querySelector(".view-interview-btn");

                if (viewBtn) {

                    viewBtn.addEventListener("click", (e) => {

                        e.stopPropagation();

                        document.getElementById("inviteCompany").textContent =
                            app.company_name;

                        document.getElementById("inviteJob").textContent =
                            app.job_title;

                      const formattedDate = new Date(app.interview_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
});

document.getElementById("inviteDate").textContent = formattedDate;

document.getElementById("inviteTime").textContent =
    `${formatTime(app.start_time)} - ${formatTime(app.end_time)}`;

document.getElementById("inviteType").textContent =
    app.interview_type === "onsite"
        ? "On-site"
        : "Online";

                        const meetingRow = document.getElementById("inviteMeeting").closest(".invite-row");
                        const locationRow = document.getElementById("inviteLocation").closest(".invite-row");

                        if (app.interview_type === "onsite") {

                            locationRow.style.display = "flex";
                            meetingRow.style.display = "none";

                            document.getElementById("inviteLocation").textContent =
                                app.location || "-";

                        } else {

                            meetingRow.style.display = "flex";
                            locationRow.style.display = "none";

                            document.getElementById("inviteMeeting").textContent =
                                app.meeting_link || "-";

                        }

                        document.getElementById("inviteNotes").textContent =
                            app.notes || "-";

                        overlay.style.display = "flex";

                    });

                }

                // ==========================
                // Open Job
                // ==========================

                row.addEventListener("click", () => {

                    window.location.href =
                        `/view_joblist.html?id=${app.job_id}`;

                });

                container.appendChild(row);

            });

        }

        catch (err) {

            console.error(err);

            container.innerHTML =
                "<p>Error loading applications.</p>";

        }

    }

    // ===============================
    // Chat
    // ===============================

    async function openChat(otherUserId) {

        try {

            const res = await fetch(`${API_BASE}/api/chat/conversation/start`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({
                    otherUserId
                })

            });

            const data = await res.json();

            if (!res.ok || !data.conversationId) {

                throw new Error(data.error || "Failed");

            }

            await fetch(`${API_BASE}/api/chat/context/set`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "include",

                body: JSON.stringify({

                    otherUserId,

                    jobId: null

                })

            });

            window.location.href = "/conversation.html";

        }

        catch (err) {

            console.error("openChat error:", err);

            alert("Failed to open chat.");

        }

    }

    // ===============================
    // Interview Modal
    // ===============================

    document.getElementById("closeViewInterview")
        .addEventListener("click", () => {

            overlay.style.display = "none";

        });

    document.getElementById("closeInvitationBtn")
        .addEventListener("click", () => {

            overlay.style.display = "none";

        });

    overlay.addEventListener("click", (e) => {

        if (e.target === overlay) {

            overlay.style.display = "none";

        }

    });

    // ===============================
    // Init
    // ===============================

    loadMyApplications();

});
