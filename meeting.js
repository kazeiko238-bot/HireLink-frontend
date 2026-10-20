document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://hirelink-backend-qnww.onrender.com";

    const container = document.getElementById("meetingList");
    const noMeetings = document.getElementById("noMeetings");

    let currentUser = null;

    function escapeHTML(value) {
        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(date) {
        if (!date) {
            return "-";
        }

        const parsedDate = new Date(date);

        if (isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    function formatTime(time) {
        if (!time) {
            return "-";
        }

        const parts = String(time).split(":");
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);

        if (isNaN(hour) || isNaN(minute)) {
            return "-";
        }

        return new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    function formatStatus(status) {
        if (!status) {
            return "Scheduled";
        }

        return String(status)
            .replace(/_/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    /*
    =====================================================
    CHECK THE SCHEDULED MEETING TIME
    =====================================================
    The meeting cannot be entered before its start time.
    The meeting expires when its end time is reached.
    */

    function getMeetingTimes(meeting) {
        if (
            !meeting ||
            !meeting.interview_date ||
            !meeting.start_time ||
            !meeting.end_time
        ) {
            return null;
        }

        const datePart = String(meeting.interview_date).slice(0, 10);
        const startTimePart = String(meeting.start_time).slice(0, 8);
        const endTimePart = String(meeting.end_time).slice(0, 8);

        // Interpret the scheduled time in the user's local timezone.
        const scheduledStart = new Date(
            `${datePart}T${startTimePart}`
        );

        const scheduledEnd = new Date(
            `${datePart}T${endTimePart}`
        );

        if (
            Number.isNaN(scheduledStart.getTime()) ||
            Number.isNaN(scheduledEnd.getTime())
        ) {
            console.warn("Invalid scheduled meeting date/time:", meeting);
            return null;
        }

        return {
            start: scheduledStart.getTime(),
            end: scheduledEnd.getTime()
        };
    }

    function isMeetingNotStarted(meeting) {
        const times = getMeetingTimes(meeting);

        if (!times) {
            return false;
        }

        return Date.now() < times.start;
    }

    function isMeetingExpired(meeting) {
        const times = getMeetingTimes(meeting);

        if (!times) {
            return false;
        }

        return Date.now() >= times.end;
    }

    function canEnterMeeting(meeting) {
        const times = getMeetingTimes(meeting);

        if (!times) {
            return false;
        }

        const now = Date.now();

        return now >= times.start && now < times.end;
    }

    function getMeetingTimeMessage(meeting) {
        if (isMeetingNotStarted(meeting)) {
            return "This meeting has not started yet";
        }

        if (isMeetingExpired(meeting)) {
            return "This meeting room expired";
        }

        if (!getMeetingTimes(meeting)) {
            return "The scheduled meeting time is unavailable";
        }

        return "";
    }

    async function getCurrentUser() {
        try {
            const res = await fetch(`${API_BASE}/api/me`, {
                credentials: "include"
            });

            const contentType = res.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                const text = await res.text();

                console.error(
                    "Expected JSON but received:",
                    text.substring(0, 300)
                );

                throw new Error("Server did not return JSON.");
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                    "Unable to get current user."
                );
            }

            if (!data.role) {
                throw new Error("User is not logged in.");
            }

            currentUser = data;

            return currentUser;
        }
        catch (err) {
            console.error("getCurrentUser error:", err);
            return null;
        }
    }

    function getInterviewEndpoint() {
        if (!currentUser) {
            return null;
        }

        if (currentUser.role === "jobseeker") {
            return `${API_BASE}/api/interview/jobseeker`;
        }

        if (
            currentUser.role === "employer" ||
            currentUser.role === "company"
        ) {
            return `${API_BASE}/api/interview/employer`;
        }

        return null;
    }

    async function loadMeetings() {
        try {
            if (!currentUser) {
                throw new Error("You are not logged in.");
            }

            const endpoint = getInterviewEndpoint();

            if (!endpoint) {
                throw new Error("Unable to determine your account role.");
            }

            console.log("Loading:", endpoint);

            const res = await fetch(endpoint, {
                credentials: "include"
            });

            const contentType = res.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                const text = await res.text();

                console.error(
                    "Server returned non-JSON:",
                    text.substring(0, 500)
                );

                throw new Error(
                    `Server returned ${res.status} instead of JSON.`
                );
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                    data.message ||
                    `Server returned ${res.status}.`
                );
            }

            console.log("Interview response:", data);

            const interviews = Array.isArray(data) ? data : [];

            renderMeetings(interviews);
        }
        catch (err) {
            console.error("loadMeetings error:", err);

            if (container) {
                container.innerHTML = `
                    <div class="meeting-error">
                        <h3>Unable to load meetings</h3>
                        <p>${escapeHTML(
                            err.message || "Something went wrong."
                        )}</p>
                        <button id="retryMeetingsBtn" type="button">
                            Try Again
                        </button>
                    </div>
                `;

                const retryBtn = document.getElementById(
                    "retryMeetingsBtn"
                );

                if (retryBtn) {
                    retryBtn.addEventListener("click", loadMeetings);
                }
            }
        }
    }

    function renderMeetings(interviews) {
        if (!container) {
            console.error("meetingList element not found.");
            return;
        }

        container.innerHTML = "";

        const meetings = interviews.filter(interview => {
            return interview.interview_type === "online";
        });

        if (meetings.length === 0) {
            if (noMeetings) {
                noMeetings.classList.remove("hidden");
            }

            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Meetings</h3>
                    <p>
                        You currently have no scheduled online meetings.
                    </p>
                </div>
            `;

            return;
        }

        if (noMeetings) {
            noMeetings.classList.add("hidden");
        }

        meetings.sort((a, b) => {
            const dateA = new Date(
                `${a.interview_date}T${a.start_time}`
            );

            const dateB = new Date(
                `${b.interview_date}T${b.start_time}`
            );

            return dateA - dateB;
        });

        meetings.forEach(interview => {
            const card = createMeetingCard(interview);
            container.appendChild(card);
        });
    }

    function createMeetingCard(interview) {
        const card = document.createElement("div");

        card.className = "meeting-card";

        const isEmployer =
            currentUser.role === "employer" ||
            currentUser.role === "company";

        const jobTitle =
            interview.job_title || "Interview";

        const meetingId =
            interview.meeting_id ||
            interview.id ||
            "-";

        const roomCode =
            interview.room_code ||
            interview.roomCode ||
            interview.meeting_room ||
            "-";

        const meetingStatus =
            interview.meeting_status || "waiting";

        let personLabel;
        let personName;

        if (isEmployer) {
            personLabel = "Applicant";

            personName = [
                interview.applicant_first_name,
                interview.applicant_last_name
            ]
                .filter(Boolean)
                .join(" ");

            if (!personName) {
                personName = interview.applicant_name || "-";
            }
        }
        else {
            personLabel = "Company";
            personName = interview.company_name || "-";
        }

        const notStarted = isMeetingNotStarted(interview);
        const expired = isMeetingExpired(interview);
        const timeUnavailable = !getMeetingTimes(interview);

        const cannotEnter = notStarted || expired || timeUnavailable;

        const buttonText = cannotEnter
            ? "Cannot Enter"
            : isEmployer
                ? "Start Meeting"
                : "Enter Meeting";

        const statusClass = String(meetingStatus)
            .toLowerCase()
            .replace(/\s+/g, "-");

        const timeMessage = getMeetingTimeMessage(interview);

        card.innerHTML = `
            <div class="meeting-card-header">
                <div>
                    <span class="meeting-label">
                        INTERVIEW MEETING
                    </span>
                    <h2 class="meeting-title">
                        ${escapeHTML(jobTitle)}
                    </h2>
                </div>

                <span class="meeting-status ${escapeHTML(statusClass)}">
                    ${escapeHTML(formatStatus(meetingStatus))}
                </span>
            </div>

            <div class="meeting-details">
                <div class="meeting-detail">
                    <span class="detail-label">Meeting ID / Room</span>
                    <strong>${escapeHTML(meetingId)}</strong>
                    <small>Room: ${escapeHTML(roomCode)}</small>
                </div>

                <div class="meeting-detail">
                    <span class="detail-label">Date</span>
                    <strong>
                        ${escapeHTML(formatDate(interview.interview_date))}
                    </strong>
                </div>

                <div class="meeting-detail">
                    <span class="detail-label">Time</span>
                    <strong>
                        ${escapeHTML(formatTime(interview.start_time))}
                        -
                        ${escapeHTML(formatTime(interview.end_time))}
                    </strong>
                </div>

                <div class="meeting-detail">
                    <span class="detail-label">${escapeHTML(personLabel)}</span>
                    <strong>${escapeHTML(personName)}</strong>
                </div>
            </div>

            <div class="meeting-card-footer">
                <div class="meeting-info">
                    <span>
                        ${isEmployer
                            ? "You are the interviewer"
                            : "You are the applicant"}
                    </span>

                    ${cannotEnter ? `
                        <p class="meeting-expired-message">
                            ${escapeHTML(
                                timeMessage ||
                                "The scheduled meeting time is unavailable"
                            )}
                        </p>
                    ` : ""}
                </div>

                <button
                    type="button"
                    class="meeting-btn ${cannotEnter ? "meeting-expired" : ""}"
                    aria-disabled="${cannotEnter ? "true" : "false"}"
                >
                    ${buttonText}
                </button>
            </div>
        `;

        const meetingBtn = card.querySelector(".meeting-btn");

        meetingBtn.addEventListener("click", event => {
            event.preventDefault();

            // Check the scheduled start and end times again when clicked.
            if (!canEnterMeeting(interview)) {
                meetingBtn.textContent = "Cannot Enter";
                meetingBtn.classList.add("meeting-expired");
                meetingBtn.setAttribute("aria-disabled", "true");

                const info = card.querySelector(".meeting-info");
                const messageText = getMeetingTimeMessage(interview) ||
                    "The scheduled meeting time is unavailable";

                if (info) {
                    let message = info.querySelector(
                        ".meeting-expired-message"
                    );

                    if (!message) {
                        message = document.createElement("p");
                        message.className = "meeting-expired-message";
                        info.appendChild(message);
                    }

                    message.textContent = messageText;
                }

                alert(`Cannot Enter\n${messageText}`);
                return;
            }

            if (isEmployer) {
                startMeeting(interview);
            }
            else {
                enterMeeting(interview);
            }
        });

        return card;
    }

    function startMeeting(meeting) {
        // Prevent an employer from starting a meeting outside its schedule.
        if (!canEnterMeeting(meeting)) {
            const message = getMeetingTimeMessage(meeting) ||
                "The scheduled meeting time is unavailable";

            alert(`Cannot Enter\n${message}`);
            return;
        }

        const roomCode =
            meeting.room_code ||
            meeting.roomCode ||
            meeting.room_id ||
            meeting.room;

        if (!roomCode) {
            alert("Meeting room is not available.");
            console.error("No room code:", meeting);
            return;
        }

        window.location.href =
            `/meeting-room.html?room=${encodeURIComponent(roomCode)}`;
    }

    function enterMeeting(meeting) {
        // Prevent a jobseeker from entering before the start or after the end.
        if (!canEnterMeeting(meeting)) {
            const message = getMeetingTimeMessage(meeting) ||
                "The scheduled meeting time is unavailable";

            alert(`Cannot Enter\n${message}`);
            return;
        }

        const roomCode =
            meeting.room_code ||
            meeting.roomCode ||
            meeting.room_id ||
            meeting.room;

        if (!roomCode) {
            alert("Meeting room is not available.");
            console.error("No room code:", meeting);
            return;
        }

        window.location.href =
            `/meeting-room.html?room=${encodeURIComponent(roomCode)}`;
    }

    async function init() {
        console.log("=================================");
        console.log("HireLink Meeting Page");

        if (!container) {
            console.error("meetingList element was not found.");
            return;
        }

        currentUser = await getCurrentUser();

        if (!currentUser) {
            container.innerHTML = `
                <div class="meeting-error">
                    <h3>Sign in required</h3>
                    <p>
                        Please sign in to view your meetings.
                    </p>
                </div>
            `;

            return;
        }

        console.log("User:", currentUser.userId);
        console.log("Role:", currentUser.role);
        console.log("=================================");

        await loadMeetings();
    }

    init();

});
