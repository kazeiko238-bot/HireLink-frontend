document.addEventListener("DOMContentLoaded", () => {

    const API_BASE =
        "https://hirelink-backend-qnww.onrender.com";


    // =========================================================
    // ELEMENTS
    // =========================================================

    const container =
        document.getElementById("meetingList");

    const noMeetings =
        document.getElementById("noMeetings");


    // =========================================================
    // STATE
    // =========================================================

    let currentUser = null;


    // =========================================================
    // HELPERS
    // =========================================================

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =========================================================
    // FORMAT DATE
    // =========================================================

    function formatDate(date) {

        if (!date) {
            return "-";
        }

        const parsedDate =
            new Date(date);


        if (isNaN(parsedDate.getTime())) {
            return "-";
        }


        return parsedDate.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    }


    // =========================================================
    // FORMAT TIME
    // =========================================================

    function formatTime(time) {

        if (!time) {
            return "-";
        }


        const parts =
            String(time).split(":");


        const hour =
            parseInt(parts[0], 10);


        const minute =
            parseInt(parts[1], 10);


        if (
            isNaN(hour) ||
            isNaN(minute)
        ) {
            return "-";
        }


        return new Date(
            2000,
            0,
            1,
            hour,
            minute
        ).toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit",
                hour12: true
            }
        );

    }


    // =========================================================
    // FORMAT STATUS
    // =========================================================

    function formatStatus(status) {

        if (!status) {
            return "Scheduled";
        }


        return String(status)
            .replace(/_/g, " ")
            .replace(/\b\w/g, char =>
                char.toUpperCase()
            );

    }


    // =========================================================
    // GET CURRENT USER
    // =========================================================

    async function getCurrentUser() {

        try {

            /*
             * Your server already has:
             *
             * GET /api/me
             *
             * so DO NOT use /api/auth/me here.
             */

            const res = await fetch(
                `${API_BASE}/api/me`,
                {
                    credentials: "include"
                }
            );


            /*
             * Make sure the server actually returned JSON.
             */

            const contentType =
                res.headers.get("content-type") || "";


            if (
                !contentType.includes(
                    "application/json"
                )
            ) {

                const text =
                    await res.text();

                console.error(
                    "Expected JSON but received:",
                    text.substring(0, 300)
                );

                throw new Error(
                    "Server did not return JSON."
                );

            }


            const data =
                await res.json();


            if (!res.ok) {

                throw new Error(
                    data.error ||
                    "Unable to get current user."
                );

            }


            /*
             * Your /api/me returns:
             *
             * {
             *     role: "...",
             *     userId: "..."
             * }
             */

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


    // =========================================================
    // GET INTERVIEW ENDPOINT
    // =========================================================

    function getInterviewEndpoint() {

        if (!currentUser) {
            return null;
        }


        /*
         * IMPORTANT:
         *
         * server.js uses:
         *
         * app.use("/api/interview", interviewRoutes);
         *
         * Therefore the correct URLs are:
         *
         * /api/interview/jobseeker
         * /api/interview/employer
         */

        if (
            currentUser.role === "jobseeker"
        ) {

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


    // =========================================================
    // LOAD MEETINGS / INTERVIEWS
    // =========================================================

    async function loadMeetings() {

        try {

            if (!currentUser) {

                throw new Error(
                    "You are not logged in."
                );

            }


            const endpoint =
                getInterviewEndpoint();


            if (!endpoint) {

                throw new Error(
                    "Unable to determine your account role."
                );

            }


            console.log(
                "Loading:",
                endpoint
            );


            const res =
                await fetch(
                    endpoint,
                    {
                        credentials: "include"
                    }
                );


            /*
             * Check whether response is JSON
             * before calling response.json().
             */

            const contentType =
                res.headers.get("content-type") || "";


            if (
                !contentType.includes(
                    "application/json"
                )
            ) {

                const text =
                    await res.text();

                console.error(
                    "Server returned non-JSON:",
                    text.substring(0, 500)
                );

                throw new Error(
                    `Server returned ${res.status} instead of JSON.`
                );

            }


            const data =
                await res.json();


            if (!res.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    `Server returned ${res.status}.`
                );

            }


            console.log(
                "Interview response:",
                data
            );


            /*
             * Your controller returns:
             *
             * res.json(result.rows)
             *
             * so data should be an array.
             */

            const interviews =
                Array.isArray(data)
                    ? data
                    : [];


            renderMeetings(interviews);

        }

        catch (err) {

            console.error(
                "loadMeetings error:",
                err
            );


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


    // =========================================================
    // RENDER MEETINGS
    // =========================================================

    function renderMeetings(interviews) {

        if (!container) {

            console.error(
                "meetingList element not found."
            );

            return;

        }


        container.innerHTML = "";


        /*
         * Only online interviews have
         * HireLink meeting rooms.
         */

        const meetings =
            interviews.filter(interview => {

                return (
                    interview.interview_type ===
                    "online"
                );

            });


        if (meetings.length === 0) {

            if (noMeetings) {

                noMeetings.classList.remove(
                    "hidden"
                );

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

            noMeetings.classList.add(
                "hidden"
            );

        }


        /*
         * Sort by date and start time.
         */

        meetings.sort(
            (a, b) => {

                const dateA =
                    new Date(
                        `${a.interview_date}T${a.start_time}`
                    );


                const dateB =
                    new Date(
                        `${b.interview_date}T${b.start_time}`
                    );


                return dateA - dateB;

            }
        );


        meetings.forEach(
            interview => {

                const card =
                    createMeetingCard(
                        interview
                    );


                container.appendChild(card);

            }
        );

    }


    // =========================================================
    // CREATE MEETING CARD
    // =========================================================

    function createMeetingCard(interview) {

        const card =
            document.createElement("div");


        card.className =
            "meeting-card";


        const isEmployer =
            currentUser.role === "employer" ||
            currentUser.role === "company";


        // =====================================================
        // JOB INFORMATION
        // =====================================================

        const jobId =
            interview.job_id ||
            interview.jobId ||
            interview.application_id ||
            "-";


        const jobTitle =
            interview.job_title ||
            "Interview";


        // =====================================================
        // MEETING INFORMATION
        // =====================================================

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


        // =====================================================
        // PERSON
        // =====================================================

        let personLabel;
        let personName;


        if (isEmployer) {

            personLabel =
                "Applicant";


            personName =
                [
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

            personLabel =
                "Company";


            personName =
                interview.company_name ||
                "-";

        }


        // =====================================================
        // BUTTON
        // =====================================================

        const buttonText =
            isEmployer
                ? "Start Meeting"
                : "Enter Meeting";


        // =====================================================
        // STATUS
        // =====================================================

        const statusClass =
            String(meetingStatus)
                .toLowerCase()
                .replace(/\s+/g, "-");


        // =====================================================
        // CARD HTML
        // =====================================================

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
                    class="meeting-status ${escapeHTML(
                        statusClass
                    )}"
                >
                    ${escapeHTML(
                        formatStatus(
                            meetingStatus
                        )
                    )}
                </span>

            </div>


            <div class="meeting-details">


                <!-- MEETING ID -->

                <div class="meeting-detail">

                    <span class="detail-label">
                        Meeting ID / Room
                    </span>

                    <strong>
                        ${escapeHTML(
                            meetingId
                        )}
                    </strong>

                    <small>
                        Room:
                        ${escapeHTML(
                            roomCode
                        )}
                    </small>

                </div>


                <!-- JOB ID -->

                <div class="meeting-detail">

                    <span class="detail-label">
                        Job ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            jobId
                        )}
                    </strong>

                </div>


                <!-- DATE -->

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


                <!-- TIME -->

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


                <!-- COMPANY / APPLICANT -->

                <div class="meeting-detail">

                    <span class="detail-label">
                        ${escapeHTML(
                            personLabel
                        )}
                    </span>

                    <strong>
                        ${escapeHTML(
                            personName
                        )}
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
                    class="meeting-btn"
                >
                    ${buttonText}
                </button>

            </div>

        `;


        // =====================================================
        // BUTTON
        // =====================================================

        const meetingBtn =
            card.querySelector(
                ".meeting-btn"
            );


        meetingBtn.addEventListener(
            "click",
            () => {

                if (isEmployer) {

                    startMeeting(
                        interview
                    );

                }

                else {

                    enterMeeting(
                        interview
                    );

                }

            }
        );


        return card;

    }


  // =====================================================
// Company: Start Meeting
// =====================================================

function startMeeting(meeting) {

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


// =====================================================
// Jobseeker: Enter Meeting
// =====================================================

function enterMeeting(meeting) {

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

    // =========================================================
    // INITIALIZE
    // =========================================================

    async function init() {

        console.log(
            "================================="
        );

        console.log(
            "HireLink Meeting Page"
        );


        if (!container) {

            console.error(
                "meetingList element was not found."
            );

            return;

        }


        currentUser =
            await getCurrentUser();


        if (!currentUser) {

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


        console.log(
            "================================="
        );


        await loadMeetings();

    }


    init();

});
