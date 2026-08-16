document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://hirelink-backend-qnww.onrender.com";

    const container = document.getElementById("meetingList");
    const noMeetings = document.getElementById("noMeetings");

    let currentUser = null;

    // =====================================================
    // Helpers
    // =====================================================

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

        return new Date(date).toLocaleDateString("en-US", {
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

        // Handles HH:MM or HH:MM:SS
        const parts = time.split(":");

        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);

        return new Date(0, 0, 0, hour, minute)
            .toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            });

    }


    function formatStatus(status) {

        if (!status) {
            return "Scheduled";
        }

        return status
            .replace(/_/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase());

    }


    // =====================================================
    // Get Current User
    // =====================================================

    async function getCurrentUser() {

        try {

            const res = await fetch(`${API_BASE}/api/auth/me`, {
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Unable to get user.");
            }

            /*
             * Depending on your backend, the user may be returned as:
             *
             * data
             *
             * or:
             *
             * data.user
             */

            currentUser = data.user || data;

            return currentUser;

        }

        catch (err) {

            console.error("getCurrentUser error:", err);

            return null;

        }

    }


    // =====================================================
    // Load My Meetings
    // =====================================================

    async function loadMyMeetings() {

        try {

            const res = await fetch(`${API_BASE}/api/meeting/my`, {
                credentials: "include"
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to load meetings.");
            }

            container.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {

                noMeetings.classList.remove("hidden");

                return;

            }

            noMeetings.classList.add("hidden");

            data.forEach(meeting => {

                const card = createMeetingCard(meeting);

                container.appendChild(card);

            });

        }

        catch (err) {

            console.error("loadMyMeetings error:", err);

            container.innerHTML = `
                <div class="meeting-error">
                    <h3>Unable to load meetings</h3>
                    <p>
                        Something went wrong while loading your meetings.
                    </p>
                    <button id="retryMeetingsBtn">
                        Try Again
                    </button>
                </div>
            `;

            const retryBtn =
                document.getElementById("retryMeetingsBtn");

            if (retryBtn) {

                retryBtn.addEventListener("click", loadMyMeetings);

            }

        }

    }


    // =====================================================
    // Create Meeting Card
    // =====================================================

    function createMeetingCard(meeting) {

        const card = document.createElement("div");

        card.className = "meeting-card";

        /*
         * Determine whether the logged-in user is the employer
         * or the applicant.
         */

        const isCompany =
            currentUser.role === "company" ||
            currentUser.role === "employer";

        // -------------------------------------------------
        // Person shown on the card
        // -------------------------------------------------

        const personLabel =
            isCompany
                ? "Applicant"
                : "Company";

        const personName =
            isCompany
                ? (
                    meeting.applicant_name ||
                    meeting.applicant?.name ||
                    "-"
                )
                : (
                    meeting.company_name ||
                    meeting.company?.name ||
                    "-"
                );


        // -------------------------------------------------
        // Meeting information
        // -------------------------------------------------

        const meetingId =
            meeting.meeting_id ||
            meeting.id ||
            "-";

        const roomId =
            meeting.room_id ||
            meeting.room ||
            meeting.meeting_room ||
            "-";

        const jobId =
            meeting.job_id ||
            "-";

        const jobTitle =
            meeting.job_title ||
            meeting.position ||
            "Interview";


        const interviewDate =
            meeting.interview_date ||
            meeting.date ||
            meeting.start_date;


        const startTime =
            meeting.start_time ||
            meeting.startTime;


        const endTime =
            meeting.end_time ||
            meeting.endTime;


        const status =
            meeting.status ||
            "scheduled";


        // -------------------------------------------------
        // Button
        // -------------------------------------------------

        let buttonText = "Enter Meeting";

        if (isCompany) {
            buttonText = "Start Meeting";
        }


        // -------------------------------------------------
        // Status class
        // -------------------------------------------------

        const statusClass =
            status
                .toLowerCase()
                .replace(/\s+/g, "-");


        // -------------------------------------------------
        // Build card
        // -------------------------------------------------

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

                <span class="meeting-status ${statusClass}">
                    ${escapeHTML(formatStatus(status))}
                </span>

            </div>


            <div class="meeting-details">

                <div class="meeting-detail">

                    <span class="detail-label">
                        Meeting ID / Room
                    </span>

                    <strong>
                        ${escapeHTML(meetingId)}
                    </strong>

                    <small>
                        ${escapeHTML(roomId)}
                    </small>

                </div>


                <div class="meeting-detail">

                    <span class="detail-label">
                        Job ID
                    </span>

                    <strong>
                        ${escapeHTML(jobId)}
                    </strong>

                </div>


                <div class="meeting-detail">

                    <span class="detail-label">
                        Date
                    </span>

                    <strong>
                        ${escapeHTML(formatDate(interviewDate))}
                    </strong>

                </div>


                <div class="meeting-detail">

                    <span class="detail-label">
                        Time
                    </span>

                    <strong>
                        ${escapeHTML(formatTime(startTime))}
                        -
                        ${escapeHTML(formatTime(endTime))}
                    </strong>

                </div>


                <div class="meeting-detail">

                    <span class="detail-label">
                        ${personLabel}
                    </span>

                    <strong>
                        ${escapeHTML(personName)}
                    </strong>

                </div>

            </div>


            <div class="meeting-card-footer">

                <div class="meeting-info">

                    <span>
                        ${isCompany
                            ? "You are the interviewer"
                            : "You are the applicant"
                        }
                    </span>

                </div>


                <button
                    class="meeting-btn"
                    data-meeting-id="${escapeHTML(meetingId)}"
                >

                    ${buttonText}

                </button>

            </div>

        `;


        // =================================================
        // Meeting Button
        // =================================================

        const meetingBtn =
            card.querySelector(".meeting-btn");


        meetingBtn.addEventListener("click", (e) => {

            e.stopPropagation();

            if (isCompany) {

                startMeeting(meeting);

            } else {

                enterMeeting(meeting);

            }

        });


        return card;

    }


    // =====================================================
    // Company: Start Meeting
    // =====================================================

    async function startMeeting(meeting) {

        const meetingId =
            meeting.meeting_id ||
            meeting.id;


        if (!meetingId) {

            alert("Invalid meeting.");

            return;

        }


        try {

            /*
             * Tell the backend that the employer has started
             * the meeting.
             */

            const res = await fetch(
                `${API_BASE}/api/meeting/${meetingId}/start`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include"
                }
            );


            const data = await res.json();


            if (!res.ok) {

                throw new Error(
                    data.error ||
                    "Unable to start meeting."
                );

            }


            /*
             * Backend can return a meeting URL.
             *
             * Example:
             *
             * {
             *     "meetingUrl": "/meeting-room.html?id=123"
             * }
             */

            if (data.meetingUrl) {

                window.location.href = data.meetingUrl;

                return;

            }


            // Fallback
            window.location.href =
                `/meeting-room.html?id=${encodeURIComponent(meetingId)}`;

        }

        catch (err) {

            console.error("startMeeting error:", err);

            alert(
                err.message ||
                "Unable to start the meeting."
            );

        }

    }


    // =====================================================
    // Jobseeker: Enter Meeting
    // =====================================================

    async function enterMeeting(meeting) {

        const meetingId =
            meeting.meeting_id ||
            meeting.id;


        if (!meetingId) {

            alert("Invalid meeting.");

            return;

        }


        try {

            /*
             * Optional backend check.
             *
             * This allows the backend to determine whether
             * the employer has already started the meeting.
             */

            const res = await fetch(
                `${API_BASE}/api/meeting/${meetingId}/join`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    credentials: "include"
                }
            );


            const data = await res.json();


            if (!res.ok) {

                throw new Error(
                    data.error ||
                    "Unable to enter meeting."
                );

            }


            if (data.meetingUrl) {

                window.location.href =
                    data.meetingUrl;

                return;

            }


            window.location.href =
                `/meeting-room.html?id=${encodeURIComponent(meetingId)}`;

        }

        catch (err) {

            console.error("enterMeeting error:", err);

            alert(
                err.message ||
                "The meeting is not available yet."
            );

        }

    }


    // =====================================================
    // Optional: Sort Meetings
    // =====================================================

    function sortMeetings(meetings) {

        return meetings.sort((a, b) => {

            const dateA =
                new Date(
                    `${a.interview_date}T${a.start_time}`
                );

            const dateB =
                new Date(
                    `${b.interview_date}T${b.start_time}`
                );

            return dateA - dateB;

        });

    }


    // =====================================================
    // Init
    // =====================================================

    async function init() {

        if (!container) {

            console.error(
                "meetingList element was not found."
            );

            return;

        }


        if (!noMeetings) {

            console.warn(
                "noMeetings element was not found."
            );

        }


        currentUser =
            await getCurrentUser();


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


        console.log(
            "Logged in user:",
            currentUser
        );


        console.log(
            "User role:",
            currentUser.role
        );


        await loadMyMeetings();

    }


    init();

});
