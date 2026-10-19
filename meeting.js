
document.addEventListener("DOMContentLoaded", () => {

    const API_BASE = "https://hirelink-backend-qnww.onrender.com";

    const container = document.getElementById("meetingList");
    const noMeetings = document.getElementById("noMeetings");

    let currentUser = null;

    // =====================================================
    // ESCAPE HTML
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

    // =====================================================
    // FORMAT DATE
    // =====================================================

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

    // =====================================================
    // FORMAT TIME
    // =====================================================

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

        return new Date(
            2000,
            0,
            1,
            hour,
            minute
        ).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    // =====================================================
    // CHECK WHETHER THE MEETING HAS EXPIRED
    // =====================================================

    function isMeetingExpired(interview) {
        if (
            !interview.interview_date ||
            !interview.end_time
        ) {
            return false;
        }

        const date = String(
            interview.interview_date
        ).slice(0, 10);

        const time = String(
            interview.end_time
        ).slice(0, 8);

        /*
         * The scheduled date and time are interpreted
         * in the browser's local timezone.
         */

        const endDateTime = new Date(
            `${date}T${time}`
        );

        if (isNaN(endDateTime.getTime())) {
            console.error(
                "Invalid meeting end date/time:",
                interview.interview_date,
                interview.end_time
            );

            return false;
        }

        // Expired once the scheduled end time is reached.
        return Date.now() >= endDateTime.getTime();
    }

    // =====================================================
    // FORMAT STATUS
    // =====================================================

    function formatStatus(status) {
        if (!status) {
            return "Scheduled";
        }

        return String(status)
            .replace(/_/g, " ")
            .replace(/\b\w/g, char => char.toUpperCase());
    }

    // =====================================================
    // GET CURRENT USER
    // =====================================================

    async function getCurrentUser() {
        try {
            const res = await fetch(
                `${API_BASE}/api/me`,
                {
                    credentials: "include"
                }
            );

            const contentType =
                res.headers.get("content-type") || "";

            if (!contentType.includes("application/json")) {
                const text = await res.text();

                console.error(
                    "Expected JSON but received:",
                    text.substring(0, 300)
                );

                throw new Error(
                    "Server did not return JSON."
                );
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(
                    data.error ||
                    "Unable to get current user."
                );
            }

            if (!data.role) {
                throw new Error(
                    "User is not logged in."
                );
            }

            currentUser = data;

            return currentUser;
        }
        catch (err) {
            console.error(
                "getCurrentUser error:",
                err
            );

            return null;
        }
    }

    // =====================================================
    // SELECT INTERVIEW ENDPOINT BY ROLE
    // =====================================================

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

    // =====================================================
    // LOAD MEETINGS
    // =====================================================

    async function loadMeetings() {
        try {
            if (!currentUser) {
                throw new Error(
                    "You are not logged in."
                );
            }

            const endpoint = getInterviewEndpoint();

            if (!endpoint) {
                throw new Error(
                    "Unable to determine your account role."
                );
            }

            console.log("Loading meetings:", endpoint);

            const res = await fetch(endpoint, {
                credentials: "include"
            });

            const contentType =
                res.headers.get("content-type") || "";

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

            const interviews = Array.isArray(data)
                ? data
                : [];

            renderMeetings(interviews);
        }
        catch (err) {
            console.error(
                "loadMeetings error:",
                err
            );

            if (noMeetings) {
                noMeetings.classList.add("hidden");
            }

            if (container) {
                container.innerHTML = `
                    <div class="meeting-error">
                        <h3>
                            Unable to load meetings
                        </h3>

                        <p>
                            ${escapeHTML(
                                err.message ||
                                "Something went wrong."
                            )}
                        </p>

                        <button
                            id="retryMeetingsBtn"
                            type="button"
                        >
                            Try Again
                        </button>
                    </div>
                `;

                const retryBtn =
                    document.getElementById(
                        "retryMeetingsBtn"
                    );

                if (retryBtn) {
                    retryBtn.addEventListener(
                        "click",
                        loadMeetings
                    );
                }
            }
        }
    }

    // =====================================================
    // RENDER MEETING LIST
    // =====================================================

    function renderMeetings(interviews) {
        if (!container) {
            console.error(
                "meetingList element not found."
            );

            return;
        }

        container.innerHTML = "";

        // Keep online meetings only.
        const meetings = interviews.filter(interview => {
            return String(
                interview.interview_type || ""
            ).toLowerCase() === "online";
        });

        if (meetings.length === 0) {
            if (noMeetings) {
                noMeetings.classList.remove("hidden");
            }

            container.innerHTML = `
                <div class="empty-state">
                    <h3>
                        No Meetings
                    </h3>

                    <p>
                        You currently have no
                        scheduled online meetings.
                    </p>
                </div>
            `;

            return;
        }

        if (noMeetings) {
            noMeetings.classList.add("hidden");
        }

        // Sort meetings by date and start time.
        meetings.sort((a, b) => {
            const dateA = new Date(
                `${String(a.interview_date).slice(0, 10)}T${String(a.start_time).slice(0, 8)}`
            );

            const dateB = new Date(
                `${String(b.interview_date).slice(0, 10)}T${String(b.start_time).slice(0, 8)}`
            );

            return dateA - dateB;
        });

        meetings.forEach(interview => {
            const card = createMeetingCard(interview);

            container.appendChild(card);
        });
    }

    // =====================================================
    // CREATE MEETING CARD
    // =====================================================

    function createMeetingCard(interview) {
        const card = document.createElement("div");

        card.className = "meeting-card";

        const isEmployer =
            currentUser.role === "employer" ||
            currentUser.role === "company";

        const jobTitle =
            interview.job_title ||
            "Interview";

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
            interview.meeting_status ||
            "waiting";

        // Determine the other participant's name.
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
                personName =
                    interview.applicant_name ||
                    "-";
            }
        }
        else {
            personLabel = "Company";

            personName =
                interview.company_name ||
                "-";
        }

        // Check expiry before displaying the button.
        const expired = isMeetingExpired(interview);

        const buttonText = expired
            ? "Meeting Room Expired"
            : isEmployer
                ? "Start Meeting"
                : "Enter Meeting";

        const statusClass = String(meetingStatus)
            .toLowerCase()
            .replace(/\s+/g, "-");

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

                <span
                    class="meeting-status ${escapeHTML(statusClass)}"
                >
                    ${escapeHTML(
                        formatStatus(meetingStatus)
                    )}
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
                        Room: ${escapeHTML(roomCode)}
                    </small>
                </div>

                <div class="meeting-detail">
                    <span class="detail-label">
                        Date
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatDate(
                                interview.interview_date
                            )
                        )}
                    </strong>
                </div>

                <div class="meeting-detail">
                    <span class="detail-label">
                        Time
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatTime(
                                interview.start_time
                            )
                        )}
                        -
                        ${escapeHTML(
                            formatTime(
                                interview.end_time
                            )
                        )}
                    </strong>
                </div>

                <div class="meeting-detail">
                    <span class="detail-label">
                        ${escapeHTML(personLabel)}
                    </span>

                    <strong>
                        ${escapeHTML(personName)}
                    </strong>
                </div>

            </div>

            <div class="meeting-card-footer">
                <div class="meeting-info">
                    <span>
                        ${
                            isEmployer
                                ? "You are the interviewer"
                                : "You are the applicant"
                        }
                    </span>
                </div>

                <button
                    type="button"
                    class="meeting-btn ${expired ? "meeting-expired" : ""}"
                    ${expired ? "disabled" : ""}
                    ${expired ? 'aria-label="Meeting room expired"' : ""}
                >
                    ${buttonText}
                </button>
            </div>
        `;

        const meetingBtn =
            card.querySelector(".meeting-btn");

        // Prevent entering an expired room.
        meetingBtn.addEventListener("click", () => {

            // Check again in case the meeting expired
            // while this page was still open.
            if (isMeetingExpired(interview)) {
                alert(
                    "Cannot Enter This meeting room expired."
                );

                meetingBtn.disabled = true;
                meetingBtn.classList.add(
                    "meeting-expired"
                );

                meetingBtn.textContent =
                    "Meeting Room Expired";

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

    // =====================================================
    // START MEETING - EMPLOYER
    // =====================================================

    function startMeeting(meeting) {
        // Final expiry check before navigation.
        if (isMeetingExpired(meeting)) {
            alert(
                "Cannot Enter This meeting room expired."
            );

            return;
        }

        const roomCode =
            meeting.room_code ||
            meeting.roomCode ||
            meeting.room_id ||
            meeting.room;

        if (!roomCode) {
            alert(
                "Meeting room is not available."
            );

            console.error(
                "No room code:",
                meeting
            );

            return;
        }

        window.location.href =
            `/meeting-room.html?room=${encodeURIComponent(roomCode)}`;
    }

    // =====================================================
    // ENTER MEETING - JOBSEEKER
    // =====================================================

    function enterMeeting(meeting) {
        // Final expiry check before navigation.
        if (isMeetingExpired(meeting)) {
            alert(
                "Cannot Enter This meeting room expired."
            );

            return;
        }

        const roomCode =
            meeting.room_code ||
            meeting.roomCode ||
            meeting.room_id ||
            meeting.room;

        if (!roomCode) {
            alert(
                "Meeting room is not available."
            );

            console.error(
                "No room code:",
                meeting
            );

            return;
        }

        window.location.href =
            `/meeting-room.html?room=${encodeURIComponent(roomCode)}`;
    }

    // =====================================================
    // INITIALIZE PAGE
    // =====================================================

    async function init() {
        console.log("=================================");
        console.log("HireLink Meeting Page");

        if (!container) {
            console.error(
                "meetingList element was not found."
            );

            return;
        }

        currentUser = await getCurrentUser();

        if (!currentUser) {
            if (noMeetings) {
                noMeetings.classList.add("hidden");
            }

            container.innerHTML = `
                <div class="meeting-error">
                    <h3>
                        Sign in required
                    </h3>

                    <p>
                        Please sign in to view
                        your meetings.
                    </p>
                </div>
            `;

            return;
        }

        console.log(
            "User:",
            currentUser.userId
        );

        console.log(
            "Role:",
            currentUser.role
        );

        console.log("=================================");

        await loadMeetings();
    }

    init();

});
