
const API_BASE = "https://hirelink-backend-qnww.onrender.com";

const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");

const filterBtn = document.getElementById("filterBtn");
const filterDropdown = document.getElementById("filterDropdown");

const interviewOverlay = document.getElementById("interviewModal");
const closeInterviewBtn = document.getElementById("closeInterviewModal");
const cancelInterviewBtn = document.getElementById("cancelInterview");
const interviewType = document.getElementById("interviewType");
const locationGroup = document.getElementById("locationGroup");

function closeInterviewModal() {
    if (interviewOverlay) {
        interviewOverlay.style.display = "none";
    }
}

closeInterviewBtn?.addEventListener("click", closeInterviewModal);
cancelInterviewBtn?.addEventListener("click", closeInterviewModal);

interviewOverlay?.addEventListener("click", (event) => {
    if (event.target === interviewOverlay) {
        closeInterviewModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && interviewOverlay?.style.display === "flex") {
        closeInterviewModal();
    }
});

document.querySelector(".back-btn")?.addEventListener("click", () => {
    if (document.referrer) {
        window.history.back();
    } else {
        window.location.href = "/";
    }
});

function setupDescriptionToggle() {
    const description = document.getElementById("description");
    const toggleBtn = document.getElementById("descriptionToggle");

    if (!description || !toggleBtn) return;

    description.classList.add("description-preview");
    description.classList.remove("description-expanded");

    toggleBtn.textContent = "See more";
    toggleBtn.setAttribute("aria-expanded", "false");
    toggleBtn.hidden = true;

    requestAnimationFrame(() => {
        const hasOverflow =
            description.scrollHeight > description.clientHeight + 2;

        toggleBtn.hidden = !hasOverflow;
    });

    toggleBtn.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const isExpanded =
            description.classList.contains("description-expanded");

        if (isExpanded) {
            description.classList.remove("description-expanded");
            description.classList.add("description-preview");

            toggleBtn.textContent = "See more";
            toggleBtn.setAttribute("aria-expanded", "false");
        } else {
            description.classList.remove("description-preview");
            description.classList.add("description-expanded");

            toggleBtn.textContent = "See less";
            toggleBtn.setAttribute("aria-expanded", "true");
        }
    };
}

async function loadRoleUI() {
    try {
        const res = await fetch(`${API_BASE}/api/me`, {
            credentials: "include"
        });

        if (!res.ok) return;

        const user = await res.json();

        if (user.role === "employer") {
            const applyBtn = document.getElementById("applyBtn");

            if (applyBtn) {
                applyBtn.style.display = "none";
            }
        }

        if (user.role === "jobseeker") {
            const applicationsContainer =
                document.getElementById("applicationsContainer");

            const jobToggleBtn = document.getElementById("jobToggleBtn");

            if (applicationsContainer) {
                applicationsContainer.style.display = "none";
            }

            if (jobToggleBtn) {
                jobToggleBtn.style.display = "none";
            }

            if (filterBtn) {
                filterBtn.style.display = "none";
            }
        }
    } catch (error) {
        console.error("Role check error:", error);
    }
}

async function loadProfile() {
    if (!jobId) {
        console.error("No job id in URL");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/jobpost/${jobId}`, {
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load job details.");
        }

        document.getElementById("job_name").textContent =
            data.title || "N/A";

        document.getElementById("company_name").textContent =
            data.company_name || "N/A";

        const emailElement = document.getElementById("email");
        const email = data.email || "";

        emailElement.textContent = email || "N/A";
        emailElement.href = email ? `mailto:${email}` : "#";

        document.getElementById("job_type").textContent =
            data.job_type || "N/A";

        const description = document.getElementById("description");

        description.textContent = data.description || "N/A";
        setupDescriptionToggle();

        document.getElementById("location").textContent =
            data.location || "N/A";

        document.getElementById("contact_no").textContent =
            data.contact_no || "N/A";

        document.getElementById("salary_min").textContent =
            data.salary_min !== null &&
            data.salary_min !== undefined &&
            data.salary_min !== ""
                ? `₱${Number(data.salary_min).toLocaleString()}`
                : "N/A";

        document.getElementById("salary_max").textContent =
            data.salary_max !== null &&
            data.salary_max !== undefined &&
            data.salary_max !== ""
                ? `₱${Number(data.salary_max).toLocaleString()}`
                : "N/A";

        const applyBtn = document.getElementById("applyBtn");

        if (applyBtn) {
            applyBtn.dataset.jobId = data.id ?? jobId;
        }
    } catch (error) {
        console.error("Job load error:", error.message);

        const description = document.getElementById("description");

        if (description) {
            description.textContent = "Unable to load job details.";
            setupDescriptionToggle();
        }
    }
}

document.getElementById("applyBtn")?.addEventListener("click", async function () {
    const selectedJobId = this.dataset.jobId;

    if (!selectedJobId) {
        alert("Job information is not available.");
        return;
    }

    this.disabled = true;
    this.textContent = "Applying...";

    try {
        const res = await fetch(`${API_BASE}/api/application`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                job_id: selectedJobId
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to apply for this job.");
        }

        this.textContent = "Applied ✓";
        this.style.background = "green";
    } catch (error) {
        alert(error.message);
        this.disabled = false;
        this.textContent = "Apply";
    }
});

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
            throw new Error(data.error || "Failed to open conversation.");
        }

        const contextRes = await fetch(`${API_BASE}/api/chat/context/set`, {
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

        if (!contextRes.ok) {
            throw new Error("Unable to set conversation context.");
        }

        window.location.href = "/conversation.html";
    } catch (error) {
        console.error("Open chat error:", error);
        alert(error.message || "Failed to open chat.");
    }
}

let allApplications = [];
let currentJobId = null;
let currentFilter = "all";

async function loadApplications(selectedJobId) {
    currentJobId = selectedJobId;

    const container = document.getElementById("applicationsContainer");

    if (!container || !selectedJobId) return;

    try {
        const res = await fetch(
            `${API_BASE}/api/application/${selectedJobId}`,
            {
                credentials: "include"
            }
        );

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load applications.");
        }

        allApplications = Array.isArray(data) ? data : [];
        filterApplications(currentFilter);
    } catch (error) {
        console.error("Applications load error:", error);
        container.textContent = "Unable to load applications.";
    }
}

function renderApplications(applications) {
    const container = document.getElementById("applicationsContainer");

    if (!container) return;

    container.replaceChildren();

    if (!applications.length) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No applications found.";
        container.appendChild(emptyMessage);
        return;
    }

    applications.forEach((app) => {
        const row = document.createElement("div");

        row.className = "app-row";
        row.dataset.id = app.application_id;

        const top = document.createElement("div");
        top.className = "app-top";

        const name = document.createElement("div");
        name.className = "app-name";
        name.textContent =
            [app.first_name, app.last_name].filter(Boolean).join(" ") ||
            "Applicant";

        const actions = document.createElement("div");
        actions.className = "app-actions";

        const messageBtn = document.createElement("button");
        messageBtn.type = "button";
        messageBtn.className = "msg-btn";
        messageBtn.textContent = "Message";

        messageBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            openChat(app.jobseeker_id);
        });

        actions.appendChild(messageBtn);

        const statusDropdown = document.createElement("div");
        statusDropdown.className = "status-dropdown";

        const statusBtn = document.createElement("button");
        statusBtn.type = "button";
        statusBtn.className = "status-btn";
        statusBtn.textContent = app.status
            ? app.status.charAt(0).toUpperCase() + app.status.slice(1)
            : "Status";

        statusBtn.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        const statusMenu = document.createElement("div");
        statusMenu.className = "status-menu";

        const statuses = [
            { value: "viewed", label: "Viewed" },
            { value: "shortlisted", label: "Shortlist" },
            { value: "interviewed", label: "Interview" },
            { value: "hired", label: "Hire" },
            { value: "rejected", label: "Reject" }
        ];

        statuses.forEach(({ value, label }) => {
            const statusItem = document.createElement("div");

            statusItem.dataset.status = value;
            statusItem.textContent = label;

            statusItem.addEventListener("click", async (event) => {
                event.stopPropagation();

                try {
                    await setStatus(app.application_id, value);

                    app.status = value;
                    statusBtn.textContent =
                        value.charAt(0).toUpperCase() + value.slice(1);

                    filterApplications(currentFilter);
                } catch (error) {
                    alert(error.message || "Failed to update application status.");
                }
            });

            statusMenu.appendChild(statusItem);
        });

        statusDropdown.append(statusBtn, statusMenu);
        actions.appendChild(statusDropdown);

        if (app.status === "shortlisted") {
            const scheduleBtn = document.createElement("button");

            scheduleBtn.type = "button";
            scheduleBtn.className = "schedule-btn";

            if (app.has_interview) {
                scheduleBtn.textContent = "Scheduled ✓";
                scheduleBtn.disabled = true;
            } else {
                scheduleBtn.textContent = "Schedule Interview";
                scheduleBtn.dataset.name =
                    [app.first_name, app.last_name].filter(Boolean).join(" ");
                scheduleBtn.dataset.application = app.application_id;
                scheduleBtn.dataset.jobseeker = app.jobseeker_id;

                scheduleBtn.addEventListener("click", (event) => {
                    event.preventDefault();
                    event.stopPropagation();

                    document.getElementById("selectedApplicant").value =
                        scheduleBtn.dataset.name;

                    interviewOverlay.dataset.application =
                        scheduleBtn.dataset.application;

                    interviewOverlay.dataset.jobseeker =
                        scheduleBtn.dataset.jobseeker;

                    interviewOverlay.style.display = "flex";
                });
            }

            actions.appendChild(scheduleBtn);
        }

        top.append(name, actions);

        const appliedDate = document.createElement("div");
        appliedDate.className = "app-date";

        const date = app.applied_at
            ? new Date(app.applied_at)
            : null;

        appliedDate.textContent =
            `Applied on: ${
                date && !Number.isNaN(date.getTime())
                    ? date.toLocaleString()
                    : "Date unavailable"
            }`;

        row.append(top, appliedDate);

        row.addEventListener("click", (event) => {
            if (
                event.target.closest(".msg-btn") ||
                event.target.closest(".status-dropdown") ||
                event.target.closest(".schedule-btn")
            ) {
                return;
            }

            window.location.href =
                `/view_jobseeker.html?id=${encodeURIComponent(app.jobseeker_id)}`;
        });

        container.appendChild(row);
    });
}

function filterApplications(status) {
    currentFilter = status;

    if (status === "all") {
        renderApplications(allApplications);
        return;
    }

    renderApplications(
        allApplications.filter((app) => app.status === status)
    );
}

filterBtn?.addEventListener("click", (event) => {
    event.stopPropagation();

    const isOpen = filterDropdown.classList.toggle("show");

    filterBtn.setAttribute("aria-expanded", String(isOpen));
});

document.addEventListener("click", () => {
    filterDropdown?.classList.remove("show");
    filterBtn?.setAttribute("aria-expanded", "false");
});

filterDropdown?.addEventListener("click", (event) => {
    event.stopPropagation();
});

document.querySelectorAll(".filter-item").forEach((item) => {
    item.addEventListener("click", () => {
        const value = item.dataset.value;

        filterBtn.textContent = `${item.textContent} ▼`;
        filterDropdown.classList.remove("show");
        filterBtn.setAttribute("aria-expanded", "false");

        filterApplications(value);
    });
});

async function setStatus(application_id, status) {
    const res = await fetch(`${API_BASE}/api/application/status`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            application_id,
            status
        })
    });

    let data = {};

    try {
        data = await res.json();
    } catch {
        // The server may return an empty response.
    }

    if (!res.ok) {
        throw new Error(data.error || "Failed to update application status.");
    }

    return data;
}

let currentJobStatus = 1;

async function loadJobStatus(selectedJobId) {
    if (!selectedJobId) return;

    try {
        const res = await fetch(`${API_BASE}/api/jobpost/${selectedJobId}`, {
            credentials: "include"
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to load job status.");
        }

        currentJobStatus = Number(data.is_active);

        const btn = document.getElementById("jobToggleBtn");

        if (btn) {
            updateJobButtonUI(btn);
        }
    } catch (error) {
        console.error("Job status error:", error);
    }
}

function updateJobButtonUI(btn) {
    if (currentJobStatus === 1) {
        btn.textContent = "Close Job";
        btn.classList.remove("closed");
    } else {
        btn.textContent = "Reopen Job";
        btn.classList.add("closed");
    }
}

document.getElementById("jobToggleBtn")?.addEventListener("click", async () => {
    const newStatus = currentJobStatus === 1 ? 0 : 1;
    const btn = document.getElementById("jobToggleBtn");

    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/jobpost/toggle`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                jobId,
                is_active: newStatus
            })
        });

        let data = {};

        try {
            data = await res.json();
        } catch {
            // The server may return an empty response.
        }

        if (!res.ok) {
            throw new Error(data.error || "Failed to update job status.");
        }

        currentJobStatus = newStatus;
        updateJobButtonUI(btn);
    } catch (error) {
        alert(error.message);
    } finally {
        btn.disabled = false;
    }
});

function updateInterviewFields() {
    if (!interviewType || !locationGroup) return;

    const isOnsite = interviewType.value === "onsite";

    locationGroup.style.display = isOnsite ? "block" : "none";

    if (!isOnsite) {
        document.getElementById("interviewLocation").value = "";
    }
}

interviewType?.addEventListener("change", updateInterviewFields);
updateInterviewFields();

document.getElementById("sendInterview")?.addEventListener("click", async () => {
    const modal = document.getElementById("interviewModal");
    const sendBtn = document.getElementById("sendInterview");

    const application_id = modal.dataset.application;
    const jobseeker_id = modal.dataset.jobseeker;

    const interview_date = document.getElementById("interviewDate").value;
    const start_time = document.getElementById("startTime").value;
    const end_time = document.getElementById("endTime").value;
    const interview_type = document.getElementById("interviewType").value;
    const location = document.getElementById("interviewLocation").value.trim();
    const notes = document.getElementById("interviewNotes").value.trim();

    if (!application_id || !jobseeker_id) {
        alert("Please select an applicant first.");
        return;
    }

    if (!interview_date || !start_time || !end_time) {
        alert("Please complete the date, start time, and end time.");
        return;
    }

    if (end_time <= start_time) {
        alert("The end time must be later than the start time.");
        return;
    }

    if (interview_type === "onsite" && !location) {
        alert("Please enter the interview location.");
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = "Scheduling...";

    try {
        const res = await fetch(`${API_BASE}/api/interview`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                application_id,
                jobseeker_id,
                interview_date,
                start_time,
                end_time,
                interview_type,
                location: interview_type === "onsite" ? location : null,
                notes
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "Failed to schedule interview.");
        }

        const application = allApplications.find(
            (app) =>
                String(app.application_id) === String(application_id)
        );

        if (application) {
            application.has_interview = true;
        }

        closeInterviewModal();

        document.getElementById("interviewDate").value = "";
        document.getElementById("startTime").value = "";
        document.getElementById("endTime").value = "";
        document.getElementById("interviewType").value = "online";
        document.getElementById("interviewLocation").value = "";
        document.getElementById("interviewNotes").value = "";

        updateInterviewFields();
        filterApplications(currentFilter);

        if (data.emailWarning) {
            alert(
                "Interview scheduled successfully, but the invitation email could not be sent."
            );
        } else {
            alert("Interview scheduled successfully!");
        }
    } catch (error) {
        console.error("Schedule interview error:", error);
        alert(error.message || "Unable to schedule interview.");
    } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "Send Invitation";
    }
});

loadRoleUI();
loadProfile();
loadApplications(jobId);
loadJobStatus(jobId);
