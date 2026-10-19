
const API_BASE = "https://hirelink-backend-1.onrender.com";

const params = new URLSearchParams(window.location.search);
const companyId = params.get("id");

const companyNameEl = document.getElementById("company_name");
const industrySubtitleEl = document.getElementById("industry_subtext");
const industryEl = document.getElementById("industry");
const companyEmailEl = document.getElementById("company_email");
const companySizeEl = document.getElementById("company_size");
const locationEl = document.getElementById("location");
const descriptionEl = document.getElementById("description");
const profilePictureEl = document.getElementById("profile_picture");

const input = document.getElementById("reviewInput");
const starSelect = document.getElementById("starReview");
const btn = document.getElementById("sendReviewBtn");
const reviewContainer = document.getElementById("reviewContainer");
const avgBox = document.getElementById("avgRating");

const jobsContainer = document.getElementById("jobsContainer");
const nextBtn = document.getElementById("nextBtn");

// =====================
// BACK BUTTON
// =====================
document.querySelector(".back-btn")?.addEventListener("click", () => {
    if (document.referrer) {
        window.history.back();
    } else {
        window.location.href = "/";
    }
});

// =====================
// HELPERS
// =====================
function setText(element, value, fallback = "Not provided") {
    if (!element) return;

    const text = String(value ?? "").trim();
    element.textContent = text || fallback;
}

function getArrayResponse(result, key) {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.[key])) return result[key];
    if (Array.isArray(result?.data)) return result.data;

    return [];
}

function readFirstValue(...values) {
    for (const value of values) {
        if (value !== null && value !== undefined) {
            const text = String(value).trim();

            if (text !== "") {
                return text;
            }
        }
    }

    return "";
}

async function readResponse(response) {
    return response.json().catch(() => ({}));
}

function formatSalary(value) {
    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        return "N/A";
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) return "N/A";

    return `₱${amount.toLocaleString("en-PH", {
        maximumFractionDigits: 2
    })}`;
}

// =====================
// COMPANY EMAIL
// =====================
function displayCompanyEmail(email) {
    if (!companyEmailEl) return;

    const savedEmail = String(email ?? "").trim();

    companyEmailEl.textContent = "";
    companyEmailEl.removeAttribute("href");

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(savedEmail)) {
        companyEmailEl.textContent = savedEmail;
        companyEmailEl.href = `mailto:${savedEmail}`;
        companyEmailEl.style.pointerEvents = "auto";
        companyEmailEl.removeAttribute("aria-disabled");
    } else {
        companyEmailEl.textContent = "Email not available";
        companyEmailEl.style.pointerEvents = "none";
        companyEmailEl.setAttribute("aria-disabled", "true");
    }
}

// =====================
// COMPANY DESCRIPTION: SEE ALL / SEE LESS
// =====================
function setupCompanyDescription(description) {
    if (!descriptionEl) return;

    descriptionEl.textContent =
        String(description ?? "").trim() ||
        "Company description unavailable";

    descriptionEl.classList.remove("description-expanded");
    descriptionEl.classList.add("description-preview");

    descriptionEl.parentElement
        ?.querySelector(".company-description-toggle")
        ?.remove();

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "company-description-toggle";
    toggleBtn.textContent = "See All";
    toggleBtn.setAttribute("aria-expanded", "false");

    descriptionEl.insertAdjacentElement("afterend", toggleBtn);

    requestAnimationFrame(() => {
        toggleBtn.hidden =
            descriptionEl.scrollHeight <= descriptionEl.clientHeight + 2;
    });

    toggleBtn.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        const expanded =
            descriptionEl.classList.toggle("description-expanded");

        descriptionEl.classList.toggle(
            "description-preview",
            !expanded
        );

        toggleBtn.textContent = expanded ? "See Less" : "See All";
        toggleBtn.setAttribute("aria-expanded", String(expanded));
    });
}

// =====================
// LOAD COMPANY PROFILE
// =====================
async function loadProfile() {
    if (!companyId) {
        setText(companyNameEl, "", "Company ID is missing");
        setText(industryEl, "", "Not provided");
        setText(industrySubtitleEl, "", "");
        setText(companySizeEl, "", "Not provided");
        setText(locationEl, "", "Not provided");
        displayCompanyEmail("");
        setupCompanyDescription("");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/companies`, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json"
            }
        });

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(
                result.error ||
                `Failed to load companies. HTTP ${response.status}`
            );
        }

        const companies = getArrayResponse(result, "companies");

        const company = companies.find(item =>
            String(item.company_id ?? item.id) === String(companyId)
        );

        if (!company) {
            setText(companyNameEl, "", "Company not found");
            setText(industryEl, "", "Not provided");
            setText(industrySubtitleEl, "", "");
            setText(companySizeEl, "", "Not provided");
            setText(locationEl, "", "Not provided");
            displayCompanyEmail("");
            setupCompanyDescription("");

            console.error("Company not found:", companyId);
            return;
        }

        setText(
            companyNameEl,
            readFirstValue(company.company_name, company.name),
            "Company name unavailable"
        );

        const industry = readFirstValue(
            company.industry,
            company.industry_name
        );

        setText(industryEl, industry);
        setText(industrySubtitleEl, industry, "");
        setText(locationEl, company.location);

        setupCompanyDescription(company.description);

        // Read the saved company size.
        const size = readFirstValue(
            company.company_size,
            company.size,
            company.companySize,
            company.employees
        );

        setText(companySizeEl, size, "Not provided");

        // Read the saved company email, preferring company_email.
        const email = readFirstValue(
            company.company_email,
            company.email,
            company.contact_email
        );

        displayCompanyEmail(email);

        if (profilePictureEl) {
            profilePictureEl.onerror = () => {
                profilePictureEl.onerror = null;
                profilePictureEl.src = "images/avatar.png";
            };

            profilePictureEl.src =
                company.profile_picture ||
                company.logo ||
                "images/avatar.png";
        }

        // Temporary diagnostic log.
        console.log("Company data received:", {
            id: company.company_id ?? company.id,
            company_name: company.company_name ?? company.name,
            company_email: company.company_email,
            company_size: company.company_size
        });
    } catch (error) {
        console.error("Error loading company profile:", error);

        setText(companyNameEl, "", "Unable to load company");
        setText(industryEl, "", "Not available");
        setText(industrySubtitleEl, "", "");
        setText(companySizeEl, "", "Not available");
        setText(locationEl, "", "Not available");

        displayCompanyEmail("");
        setupCompanyDescription("Unable to load company description");

        if (profilePictureEl) {
            profilePictureEl.src = "images/avatar.png";
        }
    }
}

// =====================
// LOAD REVIEWS AND AVERAGE RATING
// =====================
async function loadReviews() {
    if (!companyId || !reviewContainer || !avgBox) return;

    try {
        const response = await fetch(
            `${API_BASE}/api/review/${encodeURIComponent(companyId)}`,
            {
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.error || "Failed to load reviews");
        }

        const reviews = getArrayResponse(data, "reviews");
        const average = Number(data.avg_rating) || 0;

        reviewContainer.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = `⭐ ${average.toFixed(1)} / 5`;
        avgBox.replaceChildren(heading);

        if (reviews.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No reviews yet.";
            reviewContainer.appendChild(emptyMessage);
            return;
        }

        reviews.forEach(renderReview);
    } catch (error) {
        console.error("Load reviews error:", error);
        reviewContainer.textContent = "Unable to load reviews.";
    }
}

function renderReview(review) {
    const card = document.createElement("div");
    card.className = "review-card";

    const meta = document.createElement("div");
    meta.className = "review-meta";

    const name =
        `${review.first_name || "User"} ${review.last_name || ""}`.trim();

    let dateText = "";

    if (review.created_at) {
        const date = new Date(review.created_at);

        if (!Number.isNaN(date.getTime())) {
            dateText = date.toLocaleDateString();
        }
    }

    meta.textContent = dateText ? `${name} • ${dateText}` : name;

    const stars = document.createElement("div");
    stars.className = "review-stars";

    const rating = Math.max(
        0,
        Math.min(5, Math.round(Number(review.star_review) || 0))
    );

    stars.textContent = "★".repeat(rating) + "☆".repeat(5 - rating);

    const content = document.createElement("div");
    content.className = "review-content";
    content.textContent = review.content || "";

    card.append(meta, stars, content);
    reviewContainer.appendChild(card);
}

// =====================
// SUBMIT REVIEW
// =====================
btn?.addEventListener("click", async () => {
    if (!input || !starSelect) return;

    const content = input.value.trim();
    const star = Number.parseInt(starSelect.value, 10);

    if (!companyId) {
        alert("Company ID is missing.");
        return;
    }

    if (!content) {
        alert("Write a review first.");
        input.focus();
        return;
    }

    if (!Number.isInteger(star) || star < 1 || star > 5) {
        alert("Please select a valid star rating.");
        starSelect.focus();
        return;
    }

    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                company_id: companyId,
                content,
                star_review: star
            })
        });

        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.error || "Failed to post review");
        }

        input.value = "";
        starSelect.value = "5";

        await loadReviews();
    } catch (error) {
        console.error("Submit review error:", error);
        alert(error.message || "Unable to submit your review.");
    } finally {
        btn.disabled = false;
    }
});

// =====================
// JOB DESCRIPTION: SEE ALL / SEE LESS
// =====================
function setupJobDescription(description, text) {
    description.textContent =
        String(text ?? "").trim() || "No description available.";

    description.classList.remove("description-expanded");
    description.classList.add("description-preview");

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "description-toggle";
    toggleBtn.textContent = "See All";
    toggleBtn.setAttribute("aria-expanded", "false");

    description.insertAdjacentElement("afterend", toggleBtn);

    requestAnimationFrame(() => {
        toggleBtn.hidden =
            description.scrollHeight <= description.clientHeight + 2;
    });

    toggleBtn.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        const expanded =
            description.classList.toggle("description-expanded");

        description.classList.toggle(
            "description-preview",
            !expanded
        );

        toggleBtn.textContent = expanded ? "See Less" : "See All";
        toggleBtn.setAttribute("aria-expanded", String(expanded));
    });
}

// =====================
// LOAD COMPANY JOB POSTS
// =====================
async function loadCompanyJobs() {
    if (!jobsContainer) return;

    if (!companyId) {
        jobsContainer.textContent = "Company ID is missing.";
        return;
    }

    jobsContainer.textContent = "Loading job posts...";

    try {
        const response = await fetch(
            `${API_BASE}/api/companies/jobs?id=${encodeURIComponent(companyId)}`,
            {
                method: "GET",
                credentials: "include",
                headers: {
                    Accept: "application/json"
                }
            }
        );

        const result = await readResponse(response);

        if (!response.ok) {
            throw new Error(result.error || "Failed to fetch jobs");
        }

        const jobs = getArrayResponse(result, "jobs");

        jobsContainer.replaceChildren();

        if (jobs.length === 0) {
            jobsContainer.textContent = "No job ads found.";
            return;
        }

        jobs.forEach(job => {
            const card = document.createElement("div");
            card.className = "job-card-block";
            card.tabIndex = 0;
            card.setAttribute("role", "link");
            card.setAttribute(
                "aria-label",
                `View job: ${job.title || "Job details"}`
            );

            const jobTitle = String(job.title || "").toLowerCase();

            let icon = "📋";

            if (
                jobTitle.includes("developer") ||
                jobTitle.includes("programmer")
            ) {
                icon = "</>";
            } else if (jobTitle.includes("designer")) {
                icon = "▤";
            }

            const iconCircle = document.createElement("div");
            iconCircle.className = "icon-circle";
            iconCircle.textContent = icon;

            const content = document.createElement("div");
            content.className = "card-content";

            const title = document.createElement("h3");
            title.textContent = job.title || "No title";

            const details = document.createElement("p");
            details.className = "job-details";
            details.textContent =
                `${job.location || "N/A"} • ` +
                `${job.job_type || "N/A"} • ` +
                `${formatSalary(job.salary_min)} - ${formatSalary(job.salary_max)}`;

            const description = document.createElement("p");
            description.className = "description-subtext";

            content.append(title, details, description);
            setupJobDescription(description, job.description);

            const applyButton = document.createElement("button");
            applyButton.type = "button";
            applyButton.className = "btn-gradient";
            applyButton.textContent = "Apply Now";

            const jobPostId = job.id ?? job.job_id;

            const openJob = () => {
                if (jobPostId === null || jobPostId === undefined) {
                    console.error("Job post ID is missing:", job);
                    alert("Unable to open this job post.");
                    return;
                }

                window.location.href =
                    `view_joblist.html?id=${encodeURIComponent(jobPostId)}`;
            };

            card.addEventListener("click", openJob);

            card.addEventListener("keydown", event => {
                if (event.target !== card) return;

                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openJob();
                }
            });

            applyButton.addEventListener("click", event => {
                event.preventDefault();
                event.stopPropagation();
                openJob();
            });

            card.append(iconCircle, content, applyButton);
            jobsContainer.appendChild(card);
        });
    } catch (error) {
        console.error("Error fetching company jobs:", error);
        jobsContainer.textContent =
            error.message || "Unable to load job posts.";
    }
}

// =====================
// JOB CAROUSEL NAVIGATION
// =====================
nextBtn?.addEventListener("click", () => {
    jobsContainer?.scrollBy({
        left: 360,
        behavior: "smooth"
    });
});

// =====================
// INITIALIZE PAGE
// =====================
loadProfile();
loadReviews();
loadCompanyJobs();
