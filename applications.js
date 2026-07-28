document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://hirelink-backend-qnww.onrender.com";

    const container = document.getElementById("applicationContainer");

    
    const overlay = document.getElementById("viewInterviewOverlay");
    
    const viewBtn = row.querySelector(".view-interview-btn");

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

                if (viewBtn) {

                    viewBtn.addEventListener("click", (e) => {

                        e.stopPropagation();

                        document.getElementById("inviteCompany").textContent =
                            app.company_name;

                        document.getElementById("inviteJob").textContent =
                            app.job_title;

                        document.getElementById("inviteDate").textContent =
                            app.interview_date;

                        document.getElementById("inviteTime").textContent =
                            `${app.start_time} - ${app.end_time}`;

                        document.getElementById("inviteType").textContent =
                            app.interview_type;

                        document.getElementById("inviteMeeting").textContent =
                            app.meeting_link || "-";

                        document.getElementById("inviteLocation").textContent =
                            app.location || "-";

                        document.getElementById("inviteNotes").textContent =
                            app.notes || "-";

                        document.getElementById("viewInterviewOverlay").style.display = "flex";

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
