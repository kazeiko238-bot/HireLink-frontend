document.addEventListener("DOMContentLoaded", () => {

    const API_BASE =
        "https://hirelink-backend-qnww.onrender.com";


    // =====================================================
    // DOM
    // =====================================================

    const container =
        document.getElementById("meetingList");

    const noMeetings =
        document.getElementById("noMeetings");


    // =====================================================
    // USER INFORMATION
    // =====================================================

    const userName =
        localStorage.getItem("userName");

    const userRole =
        localStorage.getItem("userRole");


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHTML(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)

            .replace(
                /&/g,
                "&amp;"
            )

            .replace(
                /</g,
                "&lt;"
            )

            .replace(
                />/g,
                "&gt;"
            )

            .replace(
                /"/g,
                "&quot;"
            )

            .replace(
                /'/g,
                "&#039;"
            );

    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(date) {

        if (!date) {
            return "-";
        }


        const parsed =
            new Date(date);


        if (
            isNaN(
                parsed.getTime()
            )
        ) {

            return date;

        }


        return parsed.toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

    }


    // =====================================================
    // FORMAT TIME
    // =====================================================

    function formatTime(time) {

        if (!time) {
            return "-";
        }


        const parts =
            String(time).split(":");


        const hour =
            parseInt(
                parts[0],
                10
            );


        const minute =
            parseInt(
                parts[1],
                10
            );


        if (
            isNaN(hour) ||
            isNaN(minute)
        ) {

            return time;

        }


        return new Date(
            0,
            0,
            0,
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


    // =====================================================
    // FORMAT STATUS
    // =====================================================

    function formatStatus(status) {

        if (!status) {
            return "Waiting";
        }


        return String(status)

            .replace(
                /_/g,
                " "
            )

            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            );

    }


    // =====================================================
    // CHECK LOGIN
    // =====================================================

    function isLoggedIn() {

        return (

            userName &&

            (
                userRole === "jobseeker" ||
                userRole === "employer"
            )

        );

    }


    // =====================================================
    // SHOW LOGIN REQUIRED
    // =====================================================

    function showLoginRequired() {

        container.innerHTML = `

            <div class="meeting-error">

                <h3>
                    Sign in required
                </h3>

                <p>
                    Please sign in to view your meetings.
                </p>

                <button
                    type="button"
                    class="meeting-login-btn"
                    id="meetingLoginBtn"
                >
                    Sign In
                </button>

            </div>

        `;


        const loginButton =
            document.getElementById(
                "meetingLoginBtn"
            );


        if (loginButton) {

            loginButton.addEventListener(
                "click",
                () => {

                    const overlay =
                        document.getElementById(
                            "loginOverlay"
                        );


                    if (overlay) {

                        overlay.classList.remove(
                            "hidden"
                        );

                    }

                }
            );

        }

    }


    // =====================================================
    // LOAD MEETINGS
    // =====================================================

    async function loadMeetings() {

        try {

            const endpoint =

                userRole === "employer"

                    ? "/api/interviews/employer"

                    : "/api/interviews/jobseeker";


            console.log(
                "Loading:",
                endpoint
            );


            const response =
                await fetch(
                    `${API_BASE}${endpoint}`,
                    {
                        credentials: "include"
                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                !contentType.includes(
                    "application/json"
                )
            ) {

                throw new Error(
                    `Server returned ${response.status} instead of JSON.`
                );

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    data.message ||
                    "Failed to load meetings."
                );

            }


            console.log(
                "Interview data:",
                data
            );


            container.innerHTML = "";


            /*
             * Only ONLINE interviews have
             * a HireLink meeting room.
             */

            const meetings =
                Array.isArray(data)

                    ? data.filter(
                        interview =>
                            interview.interview_type ===
                            "online" &&
                            interview.room_code
                    )

                    : [];


            if (
                meetings.length === 0
            ) {

                showNoMeetings();

                return;

            }


            if (noMeetings) {

                noMeetings.classList.add(
                    "hidden"
                );

            }


            meetings.forEach(
                interview => {

                    const card =
                        createMeetingCard(
                            interview
                        );


                    container.appendChild(
                        card
                    );

                }
            );

        }

        catch (error) {

            console.error(
                "loadMeetings error:",
                error
            );


            container.innerHTML = `

                <div class="meeting-error">

                    <h3>
                        Unable to load meetings
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message
                        )}
                    </p>

                    <button
                        type="button"
                        id="retryMeetingsBtn"
                    >
                        Try Again
                    </button>

                </div>

            `;


            const retryButton =
                document.getElementById(
                    "retryMeetingsBtn"
                );


            if (retryButton) {

                retryButton.addEventListener(
                    "click",
                    loadMeetings
                );

            }

        }

    }


    // =====================================================
    // CREATE CARD
    // =====================================================

    function createMeetingCard(interview) {

        const card =
            document.createElement("div");


        card.className =
            "meeting-card";


        const isEmployer =
            userRole === "employer";


        // =================================================
        // DATA
        // =================================================

        const meetingId =
            interview.meeting_id ||
            "-";


        const roomCode =
            interview.room_code ||
            "-";


        const jobId =
            interview.job_id ||
            "-";


        const jobTitle =
            interview.job_title ||
            "Interview";


        const companyName =
            interview.company_name ||
            "-";


        const applicantName =
            interview.applicant_name ||

            [
                interview.first_name,
                interview.last_name
            ]
                .filter(Boolean)
                .join(" ") ||

            "-";


        const meetingStatus =
            interview.meeting_status ||
            "waiting";


        const statusClass =
            String(
                meetingStatus
            )
                .toLowerCase()
                .replace(
                    /\s+/g,
                    "-"
                );


        // =================================================
        // PERSON
        // =================================================

        const personLabel =
            isEmployer
                ? "Applicant"
                : "Company";


        const personName =
            isEmployer
                ? applicantName
                : companyName;


        // =================================================
        // BUTTON
        // =================================================

        const buttonText =
            isEmployer
                ? "Start Meeting"
                : "Enter Meeting";


        // =================================================
        // CARD
        // =================================================

        card.innerHTML = `

            <div class="meeting-card-header">

                <div>

                    <span class="meeting-label">
                        INTERVIEW MEETING
                    </span>

                    <h2 class="meeting-title">
                        ${escapeHTML(
                            jobTitle
                        )}
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
                        Meeting ID
                    </span>

                    <strong>
                        ${escapeHTML(
                            meetingId
                        )}
                    </strong>

                </div>


                <!-- ROOM -->

                <div class="meeting-detail">

                    <span class="detail-label">
                        Meeting Room
                    </span>

                    <strong>
                        ${escapeHTML(
                            roomCode
                        )}
                    </strong>

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


        // =================================================
        // BUTTON EVENT
        // =================================================

        const button =
            card.querySelector(
                ".meeting-btn"
            );


        button.addEventListener(
            "click",
            () => {

                openMeeting(
                    interview
                );

            }
        );


        return card;

    }


    // =====================================================
    // OPEN MEETING
    // =====================================================

    async function openMeeting(
        interview
    ) {

        const roomCode =
            interview.room_code;


        if (!roomCode) {

            alert(
                "This interview does not have a meeting room."
            );

            return;

        }


        // =================================================
        // EMPLOYER
        // =================================================

        if (
            userRole === "employer"
        ) {

            /*
             * Employer is the host.
             *
             * Open the meeting room directly.
             */

            window.location.href =
                `/meeting-room.html?room=${encodeURIComponent(
                    roomCode
                )}`;

            return;

        }


        // =================================================
        // JOBSEEKER
        // =================================================

        try {

            const response =
                await fetch(
                    `${API_BASE}/api/meetings/${encodeURIComponent(
                        roomCode
                    )}/join`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials: "include",

                        body: JSON.stringify({

                            name:
                                userName ||
                                "Jobseeker"

                        })

                    }
                );


            const contentType =
                response.headers.get(
                    "content-type"
                ) || "";


            if (
                !contentType.includes(
                    "application/json"
                )
            ) {

                throw new Error(
                    `Server returned ${response.status} instead of JSON.`
                );

            }


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Unable to enter meeting."
                );

            }


            console.log(
                "Join response:",
                data
            );


            /*
             * The current backend creates the
             * participant with status "pending".
             *
             * Then open the meeting room.
             */

            window.location.href =
                `/meeting-room.html?room=${encodeURIComponent(
                    roomCode
                )}`;

        }

        catch (error) {

            console.error(
                "openMeeting error:",
                error
            );


            alert(
                error.message ||
                "Unable to enter the meeting."
            );

        }

    }


    // =====================================================
    // NO MEETINGS
    // =====================================================

    function showNoMeetings() {

        if (noMeetings) {

            noMeetings.classList.remove(
                "hidden"
            );

        }


        container.innerHTML = `

            <div class="empty-state">

                <h3>
                    No upcoming meetings
                </h3>

                <p>
                    You don't have any online
                    interviews scheduled.
                </p>

            </div>

        `;

    }


    // =====================================================
    // INITIALIZE
    // =====================================================

    function init() {

        if (!container) {

            console.error(
                "meetingList element was not found."
            );

            return;

        }


        console.log(
            "================================="
        );


        console.log(
            "HireLink Meeting Page"
        );


        console.log(
            "User:",
            userName
        );


        console.log(
            "Role:",
            userRole
        );


        console.log(
            "================================="
        );


        // -----------------------------------------------
        // Check authentication
        // -----------------------------------------------

        if (!isLoggedIn()) {

            showLoginRequired();

            return;

        }


        // -----------------------------------------------
        // Load meetings
        // -----------------------------------------------

        loadMeetings();

    }


    init();

});
