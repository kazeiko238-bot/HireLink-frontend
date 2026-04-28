document.addEventListener("DOMContentLoaded", () => {

  const API_BASE = "https://hirelink-backend-qnww.onrender.com";
  
  const logoutBtn = document.getElementById("logoutBtn");
  const conversationList = document.getElementById("conversationList");
  const messagesBox = document.getElementById("messages");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatHeader = document.getElementById("chatHeader");

  let currentConversationId = null;
  let currentUserId = null;
  let refreshInterval = null;

  // =====================
  // LOGOUT
  // =====================
  logoutBtn?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "index-jobseeker.html";
  });

  // =====================
  // GET USER
  // =====================
  async function getMe() {
    const res = await fetch(`${API_BASE}/api/me`, { credentials: "include" });

    if (!res.ok) return null;

    const data = await res.json();
    currentUserId = data.userId;
    return data;
  }

  // =====================
  // LOAD CONVERSATIONS
  // =====================
  async function loadConversations() {
    const res = await fetch(`${API_BASE}/api/chat/conversation`, {
      credentials: "include"
    });

    const data = await res.json();

    conversationList.innerHTML = "";

    if (!Array.isArray(data) || data.length === 0) {
      conversationList.innerHTML = "<p>No conversations</p>";
      return;
    }

    data.forEach(c => {
      const div = document.createElement("div");
      div.className = "conversation-item";

      const otherName =
        c.user1_id === currentUserId
          ? (c.js2_name || c.co2_name)
          : (c.js1_name || c.co1_name);

      div.textContent = otherName || "Unknown User";

      div.onclick = () => {
        const otherName =
          c.user1_id === currentUserId
            ? (c.js2_name || c.co2_name)
            : (c.js1_name || c.co1_name);

        openConversation(c.id, otherName);
      };

      conversationList.appendChild(div);
    });
  }

  async function openConversation(conversationId, name) {
    if (!conversationId) return;

    currentConversationId = conversationId;

    chatHeader.textContent = "Chat with " + (name || "Unknown");

    await loadMessages();

    fetch(`${API_BASE}/api/chat/message/seen/${conversationId}`, {
      method: "PUT",
      credentials: "include"
    }).catch(() => {});

    clearInterval(refreshInterval);
    refreshInterval = setInterval(loadMessages, 2500);
  }

  // =====================
  // LOAD MESSAGES
  // =====================
  async function loadMessages() {
    if (!currentConversationId) return;

    try {
      const res = await fetch(`${API_BASE}/api/chat/message/${currentConversationId}`, {
        credentials: "include"
      });

      const data = await res.json();

      messagesBox.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        messagesBox.innerHTML = "<p style='opacity:.5'>No messages</p>";
        return;
      }

      data.forEach(msg => {
        const wrapper = document.createElement("div");

        const bubble = document.createElement("div");
        bubble.className =
          msg.sender_id === currentUserId ? "sent message" : "received message";

        // MESSAGE TEXT ONLY
        const text = document.createElement("div");
        text.textContent = msg.message;

        bubble.appendChild(text);

        // TIME (BELOW BUBBLE)
        const time = document.createElement("div");
        time.className = "msg-time";

        const date = new Date(msg.created_at);
        time.textContent = date.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });

        // SEEN (BELOW TIME, ONLY FOR SENDER)
        let seen = null;
        if (msg.sender_id === currentUserId && msg.is_seen === 1) {
          seen = document.createElement("div");
          seen.className = "seen-status";
          seen.textContent = "Seen";
        }

        // ORDER: bubble → time → seen
        wrapper.appendChild(bubble);
        wrapper.appendChild(time);
        if (seen) wrapper.appendChild(seen);

        messagesBox.appendChild(wrapper);
      });

      messagesBox.scrollTop = messagesBox.scrollHeight;

    } catch (err) {
      console.error("loadMessages error:", err);
    }
  }

  // =====================
  // SEND MESSAGE (FIXED GUARD)
  // =====================
  async function sendMessage() {
    const message = messageInput.value.trim();

    if (!currentConversationId) {
      alert("Select a conversation first");
      return;
    }

    if (!message) return;

    await fetch(`${API_BASE}/api/chat/message/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        conversation_id: currentConversationId,
        message
      })
    });

    messageInput.value = "";
    loadMessages();
  }

  // =====================
  // CHAT CONTEXT AUTO OPEN (FIXED)
  // =====================
  async function loadChatContextAndAutoOpen() {
    const res = await fetch("/api/chat/context", {
      credentials: "include"
    });

    const context = await res.json();

    if (!context?.otherUserId) return;

    const start = await fetch(`${API_BASE}/api/chat/conversation/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        otherUserId: context.otherUserId
      })
    });

    const data = await start.json();

    if (data?.conversationId) {
      await openConversation(data.conversationId);
    }
  }

  // =====================
  // EVENTS
  // =====================
  sendBtn?.addEventListener("click", sendMessage);

  messageInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // =====================
  // INIT ORDER (IMPORTANT FIX)
  // =====================
  (async () => {
    await getMe();

    await loadConversations(); // MUST load first

    await loadChatContextAndAutoOpen(); // THEN auto-open if needed
  })();

});
