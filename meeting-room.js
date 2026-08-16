document.addEventListener("DOMContentLoaded", () => {

    const API_BASE =
        "https://hirelink-backend-qnww.onrender.com";


    // ============================================================
    // ELEMENTS
    // ============================================================

    const localVideo =
        document.getElementById("localVideo");

    const remoteVideo =
        document.getElementById("remoteVideo");

    const remotePlaceholder =
        document.getElementById("remotePlaceholder");

    const localPlaceholder =
        document.getElementById("localPlaceholder");

    const roomStatus =
        document.getElementById("roomStatus");

    const roomCodeElement =
        document.getElementById("roomCode");

    const micBtn =
        document.getElementById("micBtn");

    const cameraBtn =
        document.getElementById("cameraBtn");

    const screenBtn =
        document.getElementById("screenBtn");

    const leaveBtn =
        document.getElementById("leaveBtn");

    const meetingError =
        document.getElementById("meetingError");

    const errorMessage =
        document.getElementById("errorMessage");

    const backBtn =
        document.getElementById("backBtn");


    // ============================================================
    // STATE
    // ============================================================

    let localStream = null;

    let screenStream = null;

    let peerConnection = null;

    let microphoneEnabled = true;

    let cameraEnabled = true;

    let isSharingScreen = false;


    // ============================================================
    // GET ROOM CODE
    // ============================================================

    const params =
        new URLSearchParams(window.location.search);

    const roomCode =
        params.get("room") ||
        params.get("roomCode");


    if (!roomCode) {

        showError(
            "No meeting room was specified."
        );

        return;

    }


    const normalizedRoom =
        roomCode.trim().toUpperCase();


    roomCodeElement.textContent =
        `Room: ${normalizedRoom}`;


    console.log(
        "HireLink Meeting Room:",
        normalizedRoom
    );


    // ============================================================
    // WEBRTC CONFIGURATION
    // ============================================================

    /*
     * STUN servers allow WebRTC to discover the public
     * network address of the participants.
     *
     * Later, we can add your own TURN server for users
     * behind restrictive networks.
     */

    const rtcConfiguration = {

        iceServers: [

            {
                urls:
                    "stun:stun.l.google.com:19302"
            },

            {
                urls:
                    "stun:stun1.l.google.com:19302"
            }

        ]

    };


    // ============================================================
    // GET MEETING INFORMATION
    // ============================================================

    async function loadMeeting() {

        try {

            setStatus(
                "Connecting...",
                "connecting"
            );


            const response =
                await fetch(
                    `${API_BASE}/api/meetings/${encodeURIComponent(normalizedRoom)}`,
                    {
                        credentials: "include"
                    }
                );


            let data;

            try {

                data =
                    await response.json();

            } catch {

                throw new Error(
                    "Server returned an invalid response."
                );

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    "Meeting room not found."
                );

            }


            console.log(
                "Meeting information:",
                data
            );


            await initializeCamera();


            initializePeerConnection();


            setStatus(
                "Waiting for participant...",
                "waiting"
            );


        }

        catch (error) {

            console.error(
                "loadMeeting error:",
                error
            );


            showError(
                error.message ||
                "Unable to load meeting."
            );

        }

    }


    // ============================================================
    // CAMERA + MICROPHONE
    // ============================================================

    async function initializeCamera() {

        try {

            console.log(
                "Requesting camera and microphone..."
            );


            localStream =
                await navigator.mediaDevices.getUserMedia({

                    video: {
                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }
                    },

                    audio: true

                });


            localVideo.srcObject =
                localStream;


            localVideo.style.display =
                "block";


            localPlaceholder.classList.remove(
                "visible"
            );


            console.log(
                "Camera and microphone ready."
            );

        }

        catch (error) {

            console.error(
                "getUserMedia error:",
                error
            );


            if (
                error.name ===
                "NotAllowedError"
            ) {

                throw new Error(
                    "Camera and microphone permission was denied. Please allow access and reload the meeting."
                );

            }


            if (
                error.name ===
                "NotFoundError"
            ) {

                throw new Error(
                    "No camera or microphone was found on this device."
                );

            }


            throw new Error(
                "Unable to access your camera and microphone."
            );

        }

    }


    // ============================================================
    // CREATE WEBRTC PEER CONNECTION
    // ============================================================

    function initializePeerConnection() {

        peerConnection =
            new RTCPeerConnection(
                rtcConfiguration
            );


        /*
         * Add our camera and microphone tracks
         * to the WebRTC connection.
         */

        if (localStream) {

            localStream
                .getTracks()
                .forEach(track => {

                    peerConnection.addTrack(
                        track,
                        localStream
                    );

                });

        }


        /*
         * Receive the other participant's tracks.
         */

        peerConnection.ontrack =
            event => {

                console.log(
                    "Remote track received."
                );


                if (
                    event.streams &&
                    event.streams[0]
                ) {

                    remoteVideo.srcObject =
                        event.streams[0];

                    remoteVideo.style.display =
                        "block";


                    remotePlaceholder.classList.add(
                        "hidden"
                    );


                    setStatus(
                        "Connected",
                        "connected"
                    );

                }

            };


        /*
         * ICE candidates will eventually be
         * sent through our signaling server.
         */

        peerConnection.onicecandidate =
            event => {

                if (event.candidate) {

                    console.log(
                        "ICE candidate:",
                        event.candidate
                    );

                    /*
                     * NEXT STEP:
                     *
                     * Send this candidate through
                     * Socket.IO/WebSocket.
                     */

                }

            };


        peerConnection.onconnectionstatechange =
            () => {

                console.log(
                    "WebRTC connection state:",
                    peerConnection.connectionState
                );


                switch (
                    peerConnection.connectionState
                ) {

                    case "connected":

                        setStatus(
                            "Connected",
                            "connected"
                        );

                        break;


                    case "connecting":

                        setStatus(
                            "Connecting...",
                            "connecting"
                        );

                        break;


                    case "disconnected":

                        setStatus(
                            "Disconnected",
                            "error"
                        );

                        break;


                    case "failed":

                        setStatus(
                            "Connection failed",
                            "error"
                        );

                        break;


                    case "closed":

                        setStatus(
                            "Meeting ended",
                            "error"
                        );

                        break;

                }

            };

    }


    // ============================================================
    // MICROPHONE
    // ============================================================

    micBtn.addEventListener(
        "click",
        () => {

            if (!localStream) {
                return;
            }


            const audioTracks =
                localStream.getAudioTracks();


            if (!audioTracks.length) {
                return;
            }


            microphoneEnabled =
                !microphoneEnabled;


            audioTracks.forEach(
                track => {

                    track.enabled =
                        microphoneEnabled;

                }
            );


            if (microphoneEnabled) {

                micBtn.textContent = "🎤";

                micBtn.classList.remove(
                    "off"
                );

                micBtn.title =
                    "Mute microphone";

            } else {

                micBtn.textContent = "🔇";

                micBtn.classList.add(
                    "off"
                );

                micBtn.title =
                    "Unmute microphone";

            }

        }
    );


    // ============================================================
    // CAMERA
    // ============================================================

    cameraBtn.addEventListener(
        "click",
        () => {

            if (!localStream) {
                return;
            }


            const videoTracks =
                localStream.getVideoTracks();


            if (!videoTracks.length) {
                return;
            }


            cameraEnabled =
                !cameraEnabled;


            videoTracks.forEach(
                track => {

                    track.enabled =
                        cameraEnabled;

                }
            );


            if (cameraEnabled) {

                cameraBtn.textContent =
                    "📹";

                cameraBtn.classList.remove(
                    "off"
                );

                cameraBtn.title =
                    "Turn camera off";

                localPlaceholder.classList.remove(
                    "visible"
                );

            } else {

                cameraBtn.textContent =
                    "📵";

                cameraBtn.classList.add(
                    "off"
                );

                cameraBtn.title =
                    "Turn camera on";

                localPlaceholder.classList.add(
                    "visible"
                );

            }

        }
    );


    // ============================================================
    // SCREEN SHARE
    // ============================================================

    screenBtn.addEventListener(
        "click",
        async () => {

            await toggleScreenShare();

        }
    );


    async function toggleScreenShare() {

        if (!localStream) {
            return;
        }


        try {

            if (!isSharingScreen) {

                screenStream =
                    await navigator.mediaDevices.getDisplayMedia({
                        video: true
                    });


                const screenTrack =
                    screenStream.getVideoTracks()[0];


                const sender =
                    peerConnection
                        ?.getSenders()
                        .find(
                            s =>
                                s.track &&
                                s.track.kind === "video"
                        );


                if (sender) {

                    await sender.replaceTrack(
                        screenTrack
                    );

                }


                localVideo.srcObject =
                    screenStream;


                isSharingScreen = true;


                screenBtn.textContent =
                    "🛑";


                screenBtn.classList.add(
                    "off"
                );


                screenTrack.onended =
                    async () => {

                        await stopScreenShare();

                    };

            } else {

                await stopScreenShare();

            }

        }

        catch (error) {

            console.error(
                "Screen sharing error:",
                error
            );

        }

    }


    async function stopScreenShare() {

        if (!screenStream) {
            return;
        }


        const cameraTrack =
            localStream
                ?.getVideoTracks()[0];


        const sender =
            peerConnection
                ?.getSenders()
                .find(
                    s =>
                        s.track &&
                        s.track.kind === "video"
                );


        if (
            sender &&
            cameraTrack
        ) {

            await sender.replaceTrack(
                cameraTrack
            );

        }


        screenStream
            .getTracks()
            .forEach(
                track => track.stop()
            );


        screenStream = null;


        localVideo.srcObject =
            localStream;


        isSharingScreen = false;


        screenBtn.textContent =
            "🖥️";


        screenBtn.classList.remove(
            "off"
        );

    }


    // ============================================================
    // LEAVE MEETING
    // ============================================================

    leaveBtn.addEventListener(
        "click",
        () => {

            leaveMeeting();

        }
    );


    function leaveMeeting() {

        console.log(
            "Leaving meeting..."
        );


        if (screenStream) {

            screenStream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

        }


        if (localStream) {

            localStream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

        }


        if (peerConnection) {

            peerConnection.close();

        }


        window.location.href =
            "/meeting.html";

    }


    // ============================================================
    // STATUS
    // ============================================================

    function setStatus(
        message,
        state
    ) {

        roomStatus.textContent =
            message;


        roomStatus.classList.remove(
            "connected",
            "error"
        );


        if (state === "connected") {

            roomStatus.classList.add(
                "connected"
            );

        }


        if (state === "error") {

            roomStatus.classList.add(
                "error"
            );

        }

    }


    // ============================================================
    // ERROR
    // ============================================================

    function showError(message) {

        setStatus(
            "Error",
            "error"
        );


        errorMessage.textContent =
            message;


        meetingError.classList.remove(
            "hidden"
        );

    }


    // ============================================================
    // BACK BUTTON
    // ============================================================

    backBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "/meeting.html";

        }
    );


    // ============================================================
    // CLEANUP
    // ============================================================

    window.addEventListener(
        "beforeunload",
        () => {

            if (localStream) {

                localStream
                    .getTracks()
                    .forEach(
                        track => track.stop()
                    );

            }


            if (screenStream) {

                screenStream
                    .getTracks()
                    .forEach(
                        track => track.stop()
                    );

            }


            if (peerConnection) {

                peerConnection.close();

            }

        }
    );


    // ============================================================
    // START
    // ============================================================

    loadMeeting();

});
