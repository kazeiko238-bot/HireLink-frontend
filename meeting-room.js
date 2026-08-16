document.addEventListener("DOMContentLoaded", () => {

    const API_BASE =
        "https://hirelink-backend-qnww.onrender.com";

    const socket = io(API_BASE, {
        withCredentials: true
    });


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

    let isRoomJoined = false;

    let isInitiator = false;


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
    // SOCKET CONNECTION
    // ============================================================

    socket.on("connect", () => {

        console.log(
            "Socket.IO connected:",
            socket.id
        );


        if (isRoomJoined) {
            return;
        }


        socket.emit(
            "join-room",
            normalizedRoom
        );

    });


    socket.on("connect_error", error => {

        console.error(
            "Socket.IO connection error:",
            error
        );


        showError(
            "Unable to connect to the meeting server."
        );

    });


    // ============================================================
    // USER JOINED
    // ============================================================

    socket.on(
        "user-joined",
        async () => {

            console.log(
                "Another participant joined."
            );


            isInitiator = true;


            setStatus(
                "Participant joined. Connecting...",
                "connecting"
            );


            try {

                await createOffer();

            }

            catch (error) {

                console.error(
                    "Offer creation error:",
                    error
                );

                showError(
                    "Unable to start the video connection."
                );

            }

        }
    );


    // ============================================================
    // RECEIVE OFFER
    // ============================================================

    socket.on(
        "offer",
        async data => {

            try {

                console.log(
                    "WebRTC offer received."
                );


                if (
                    !data ||
                    !data.offer
                ) {

                    return;

                }


                if (!peerConnection) {

                    initializePeerConnection();

                }


                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(
                        data.offer
                    )
                );


                const answer =
                    await peerConnection.createAnswer();


                await peerConnection.setLocalDescription(
                    answer
                );


                socket.emit(
                    "answer",
                    {
                        roomCode:
                            normalizedRoom,

                        answer:
                            peerConnection.localDescription
                    }
                );


                setStatus(
                    "Connecting...",
                    "connecting"
                );

            }

            catch (error) {

                console.error(
                    "Offer handling error:",
                    error
                );

                showError(
                    "Unable to connect to the participant."
                );

            }

        }
    );


    // ============================================================
    // RECEIVE ANSWER
    // ============================================================

    socket.on(
        "answer",
        async data => {

            try {

                console.log(
                    "WebRTC answer received."
                );


                if (
                    !data ||
                    !data.answer ||
                    !peerConnection
                ) {

                    return;

                }


                await peerConnection.setRemoteDescription(
                    new RTCSessionDescription(
                        data.answer
                    )
                );


                setStatus(
                    "Connecting...",
                    "connecting"
                );

            }

            catch (error) {

                console.error(
                    "Answer handling error:",
                    error
                );

            }

        }
    );


    // ============================================================
    // RECEIVE ICE CANDIDATE
    // ============================================================

    socket.on(
        "ice-candidate",
        async data => {

            try {

                if (
                    !data ||
                    !data.candidate ||
                    !peerConnection
                ) {

                    return;

                }


                await peerConnection.addIceCandidate(
                    new RTCIceCandidate(
                        data.candidate
                    )
                );


                console.log(
                    "ICE candidate added."
                );

            }

            catch (error) {

                console.error(
                    "ICE candidate error:",
                    error
                );

            }

        }
    );


    // ============================================================
    // PARTICIPANT LEFT
    // ============================================================

    socket.on(
        "user-left",
        () => {

            console.log(
                "Participant left the meeting."
            );


            remoteVideo.srcObject =
                null;


            remoteVideo.style.display =
                "none";


            remotePlaceholder.classList.remove(
                "hidden"
            );


            setStatus(
                "Waiting for participant...",
                "waiting"
            );


            if (peerConnection) {

                peerConnection.close();

                peerConnection = null;

            }


            isInitiator = false;

        }
    );


    // ============================================================
    // JOIN ROOM
    // ============================================================

    socket.on(
        "room-joined",
        data => {

            console.log(
                "Joined meeting room:",
                data
            );


            isRoomJoined = true;


            const participantCount =
                data?.participantCount || 1;


            if (participantCount <= 1) {

                setStatus(
                    "Waiting for participant...",
                    "waiting"
                );

            }

        }
    );


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

            }

            catch {

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


            if (socket.connected) {

                socket.emit(
                    "join-room",
                    normalizedRoom
                );

            }


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

        if (peerConnection) {

            return;

        }


        peerConnection =
            new RTCPeerConnection(
                rtcConfiguration
            );


        // --------------------------------------------------------
        // ADD LOCAL TRACKS
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // RECEIVE REMOTE TRACKS
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // ICE CANDIDATES
        // --------------------------------------------------------

        peerConnection.onicecandidate =
            event => {

                if (
                    event.candidate
                ) {

                    console.log(
                        "Sending ICE candidate."
                    );


                    socket.emit(
                        "ice-candidate",
                        {
                            roomCode:
                                normalizedRoom,

                            candidate:
                                event.candidate
                        }
                    );

                }

            };


        // --------------------------------------------------------
        // CONNECTION STATE
        // --------------------------------------------------------

        peerConnection.onconnectionstatechange =
            () => {

                if (!peerConnection) {
                    return;
                }


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
    // CREATE OFFER
    // ============================================================

    async function createOffer() {

        if (!peerConnection) {

            initializePeerConnection();

        }


        console.log(
            "Creating WebRTC offer..."
        );


        const offer =
            await peerConnection.createOffer();


        await peerConnection.setLocalDescription(
            offer
        );


        socket.emit(
            "offer",
            {
                roomCode:
                    normalizedRoom,

                offer:
                    peerConnection.localDescription
            }
        );


        console.log(
            "WebRTC offer sent."
        );

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

                micBtn.textContent =
                    "🎤";

                micBtn.classList.remove(
                    "off"
                );

                micBtn.title =
                    "Mute microphone";

            }

            else {

                micBtn.textContent =
                    "🔇";

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

            }

            else {

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


        if (!peerConnection) {
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
                        .getSenders()
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

            }

            else {

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
           
