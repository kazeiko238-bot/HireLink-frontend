document.addEventListener("DOMContentLoaded", () => {
  const threadContainer = document.getElementById("threadContainer");
  const searchInput = document.getElementById("threadSearch");
  const categoryItems = document.querySelectorAll("#categoryList li");

  const modal = document.getElementById("threadModal");
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModal");
  const form = document.getElementById("createThreadForm");

  let currentCategory = "all";
  let threads = [];

  // =========================
  // LOAD THREADS FROM DB
  // =========================
  async function loadThreads() {
    try {
      const res = await fetch("/api/thread", {
        credentials: "include"
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load threads");

      threads = data;
      renderThreads();

    } catch (err) {
      console.error(err);
    }
  }

  // =========================
  // RENDER THREADS
  // =========================
  function renderThreads() {
    const query = searchInput.value.toLowerCase().trim();

    const filtered = threads.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query);

      const matchesCat =
        currentCategory === "all" || t.category === currentCategory;

      return matchesSearch && matchesCat;
    });

    threadContainer.innerHTML = "";

    filtered.forEach(t => {
      const card = document.createElement("div");
      card.className = "thread-card";

      card.innerHTML = `
        <div class="thread-content">
          <h3>${t.title}</h3>
          <p class="thread-meta">
          <strong>${t.poster_name || "Unknown"}</strong> • 
            ${t.category || "Uncategorized"} • ${
              t.created_at
                ? new Date(t.created_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                  })
                : ""
            }
          </p>
          <p class="thread-preview">
            ${t.content.substring(0, 120)}...
          </p>
        </div>

        <div class="thread-stats">
          <span class="stat-item like-btn">❤️ ${t.likes}</span>
          <span class="stat-item comment-toggle">💬</span>
        </div>

        <!-- REPLY SECTION -->
        <div class="reply-section hidden">
          <div class="reply-list"></div>

          <div class="reply-input-row">
            <input type="text" class="reply-input" placeholder="Write a reply..." />
            <button class="send-reply-btn">Send</button>
          </div>
        </div>
      `;

      // =========================
      // LIKE BUTTON
      // =========================
      const likeBtn = card.querySelector(".like-btn");

      likeBtn.addEventListener("click", async (e) => {
        e.stopPropagation();

        try {
          const res = await fetch("/api/thread/like", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ thread_id: t.thread_id })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          let count = parseInt(likeBtn.innerText.replace("❤️", "").trim());
          likeBtn.innerText = `❤️ ${count + 1}`;

        } catch (err) {
          alert(err.message);
        }
      });

      // =========================
      // REPLY LOGIC
      // =========================
      const toggleBtn = card.querySelector(".comment-toggle");
      const replySection = card.querySelector(".reply-section");
      const replyList = card.querySelector(".reply-list");
      const replyInput = card.querySelector(".reply-input");
      const sendBtn = card.querySelector(".send-reply-btn");

      // TOGGLE + LOAD COMMENTS
      toggleBtn.addEventListener("click", async (e) => {
        e.stopPropagation();

        replySection.classList.toggle("hidden");

        if (!replySection.classList.contains("hidden")) {
          try {
            const res = await fetch(`/api/thread/comments/${t.thread_id}`, {
              credentials: "include"
            });

            const comments = await res.json();
            replyList.innerHTML = "";

            comments.forEach(c => {
              const div = document.createElement("div");
              div.className = "reply-item";

              div.innerHTML = `
                <div class="reply-meta">
                  ${c.first_name || "User"} • 
                  ${new Date(c.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
                <div>${c.content}</div>
              `;

              replyList.appendChild(div);
            });

          } catch (err) {
            console.error(err);
          }
        }
      });

      // SEND REPLY
      sendBtn.addEventListener("click", async (e) => {
        e.stopPropagation();

        const content = replyInput.value.trim();
        if (!content) return;

        try {
          const res = await fetch("/api/thread/comment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              thread_id: t.thread_id,
              content
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          // 🔥 INSTANT UI UPDATE (PREPEND)
          const div = document.createElement("div");
          div.className = "reply-item";

          div.innerHTML = `
            <div class="reply-meta">You • just now</div>
            <div>${content}</div>
          `;

          replyList.prepend(div);
          replyInput.value = "";

        } catch (err) {
          alert(err.message);
        }
      });

      threadContainer.appendChild(card);
    });
  }

  // =========================
  // SEARCH
  // =========================
  searchInput.addEventListener("input", renderThreads);

  // =========================
  // CATEGORY FILTER
  // =========================
  categoryItems.forEach(item => {
    item.addEventListener("click", () => {
      categoryItems.forEach(li => li.classList.remove("active"));
      item.classList.add("active");

      currentCategory = item.dataset.category;
      renderThreads();
    });
  });

  // =========================
  // MODAL
  // =========================
  openModalBtn.onclick = () => modal.classList.remove("hidden");
  closeModalBtn.onclick = () => modal.classList.add("hidden");

  // =========================
  // CREATE THREAD
  // =========================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("newThreadTitle").value;
    const content = document.getElementById("newThreadContent").value;
    const category = document.getElementById("newThreadCategory").value;

    try {
      const res = await fetch("/api/thread/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, content, category })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create thread");

      modal.classList.add("hidden");
      form.reset();

      loadThreads();

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  });

  // =========================
  // INIT
  // =========================
  loadThreads();
});