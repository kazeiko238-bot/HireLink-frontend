// ========================================
// HIRELINK - VIEW COMPANY
// ========================================

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

// ========================================
// BACK BUTTON
// ========================================

document.querySelector(".back-btn")?.addEventListener("click", () => {
    if (document.referrer) {
        window.history.back();
    } else {
        window.location.href = "/";
    }
});

// ========================================
// HELPER: DISPLAY TEXT SAFELY
// ========================================

function setText(element, value, fallback = "Not provided") {
    if (!element) return;

    const text = String(value ?? "").trim();
    element.textContent = text || fallback;
}

// ========================================
// HELPER: DISPLAY COMPANY EMAIL
// ========================================

function displayCompanyEmail(email) {
    if (!companyEmailEl) return;

    const savedEmail = String(email ?? "").trim();

    // Clear any placeholder text.
    companyEmailEl.textContent = "";
    companyEmailEl.removeAttribute("href");

    if (savedEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(savedEmail)) {
        companyEmailEl.textContent = savedEmail;
        companyEmailEl.href = `mailto:${savedEmail}`;
        companyEmailEl.style.pointerEvents = "auto";
        companyEmailEl.removeAttribute("aria-disabled");
    } else {
        companyEmailEl.textContent = "Email not available";
        companyEmailEl.style.pointerEvents = "none";
        companyEmailEl.setAttribute("aria-disabled", "true");

        console.warn("No valid company email returned by the API.", email);
    }
}

// ========================================
// LOAD COMPANY PROFILE
// ========================================

async function loadProfile() {
    if (!companyId) {
        setText(companyNameEl, "", "Company ID is missing");
        displayCompanyEmail("");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/companies`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error(
                `Failed to load companies. HTTP ${response.status}`
            );
        }

        const result = await response.json();

        // Supports either an array or { companies: [...] }.
        const companies = Array.isArray(result)
            ? result
            : result.companies || result.data || [];

        // Support different ID field names.
        const company = companies.find(c =>
            String(c.company_id ?? c.id) === String(companyId)
        );

        if (!company) {
            console.error(
                "Company not found. Requested ID:",
                companyId,
                "Available companies:",
                companies
            );

            setText(companyNameEl, "", "Company not found");
            displayCompanyEmail("");
            return;
        }

        // Debugging: shows exactly what the API sent.
        console.log("Selected company:", company);
        console.log("Fields returned by API:", Object.keys(company));

        // Company name.
        setText(
            companyNameEl,
            company.company_name ?? company.name,
            "Company name unavailable"
        );

        // Industry.
        const industry = company.industry ?? company.industry_name ?? "";
        setText(industryEl, industry);
        setText(industrySubtitleEl, industry);

        // Location and description.
        setText(locationEl, company.location);
        setText(descriptionEl, company.description);

        // Company size (accepts alternate field names).
        const size =
            company.company_size ??
            company.size ??
            company.companySize ??
            company.employees;

        setText(companySizeEl, size);

        // Company email (accepts alternate field names).
        const email =
            company.company_email ??
            company.email ??
            company.contact_email;

        displayCompanyEmail(email);

        // Company profile picture.
        const picture = company.profile_picture ?? company.logo ?? "";

        if (picture && profilePictureEl) {
            profilePictureEl.src = picture;

            profilePictureEl.onerror = () => {
                profilePictureEl.onerror = null;
                profilePictureEl.src = "images/avatar.png";
            };
        }

    } catch (error) {
        console.error("Error loading company profile:", error);

        setText(companyNameEl, "", "Unable to load company");
        displayCompanyEmail("");
    }
}

// ========================================
// LOAD COMPANY REVIEWS
// ========================================

async function loadReviews() {
    if (!companyId || !reviewContainer || !avgBox) return;

    try {
        const response = await fetch(
            `${API_BASE}/api/review/${encodeURIComponent(companyId)}`,
            { credentials: "include" }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to load reviews");
        }

        const reviews = data.reviews || [];

        reviewContainer.innerHTML = "";

        // Handles numbers, numeric strings like "4.5000", null, and NaN.
        const average = Number(data.avg_rating) || 0;

        const ratingHeading = document.createElement("h3");
        ratingHeading.textContent = `⭐ ${average.toFixed(1)} / 5`;

        avgBox.replaceChildren(ratingHeading);

        if (reviews.length === 0) {
            const emptyMessage = document.createElement("p");
            emptyMessage.textContent = "No reviews yet.";
            reviewContainer.appendChild(emptyMessage);
            return;
        }

        reviews.forEach(renderReview);

    } catch (error) {
        console.error("loadReviews error:", error);
    }
}

// ========================================
// RENDER A SINGLE REVIEW
// ========================================

function renderReview(review) {
    const card = document.createElement("div");
    card.className = "review-card";

    const meta = document.createElement("div");
    meta.className = "review-meta";

    const firstName = review.first_name || "User";
    const lastName = review.last_name || "";

    const reviewDate = review.created_at
        ? new Date(review.created_at).toLocaleDateString()
        : "";

    meta.textContent = `${firstName} ${lastName} • ${reviewDate}`;

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

// ========================================
// SUBMIT A REVIEW
// ========================================

btn?.addEventListener("click", async () => {
    const content = input.value.trim();
    const star = Number.parseInt(starSelect.value, 10);

    if (!companyId) {
        alert("Company ID is missing.");
        return;
    }

    if (!content) {
        alert("Write a review first.");
        return;
    }

    if (!Number.isInteger(star) || star < 1 || star > 5) {
        alert("Please select a valid star rating.");
        return;
    }

    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/api/review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({
                company_id: companyId,
                content,
                star_review: star
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to post review");
        }

        input.value = "";
        starSelect.value = "5";

        // Reload saved reviews and the average rating.
        await loadReviews();

    } catch (error) {
        console.error("Submit review error:", error);
        alert(error.message);
    } finally {
        btn.disabled = false;
    }
});

// ========================================
// LOAD COMPANY JOBS
// ========================================

async function loadCompanyJobs() {
    if (!jobsContainer) return;

    if (!companyId) {
        jobsContainer.textContent = "Company ID is missing.";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/api/companies/jobs?id=${encodeURIComponent(companyId)}`,
            {
                method: "GET",
                credentials: "include"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Failed to fetch jobs");
        }

        // Supports either an array or { jobs: [...] }.
        const jobs = Array.isArray(result)
            ? result
            : result.jobs || result.data || [];

        console.log("Company jobs:", jobs);

        jobsContainer.innerHTML = "";

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

            let icon = "📋";

            if (job.title?.toLowerCase().includes("developer")) {
                icon = "</>";
            } else if (job.title?.toLowerCase().includes("designer")) {
                icon = "▤";
            }

            const minSalary =
                job.salary_min !== null &&
                job.salary_min !== undefined &&
                job.salary_min !== ""
                    ? `₱${Number(job.salary_min).toLocaleString()}`
                    : "N/A";

            const maxSalary =
                job.salary_max !== null &&
                job.salary_max !== undefined &&
                job.salary_max !== ""
                    ? `₱${Number(job.salary_max).toLocaleString()}`
                    : "N/A";

            const iconCircle = document.createElement("div");
            iconCircle.className = "icon-circle";
            iconCircle.textContent = icon;

            const content = document.createElement("div");
            content.className = "card-content";

            const title = document.createElement("h3");
            title.textContent = job.title || "No title";

            const details = document.createElement("p");
            details.textContent =
                `${job.location || "N/A"} • ` +
                `${job.job_type || "N/A"} • ` +
                `${minSalary} - ${maxSalary}`;

            const description = document.createElement("p");
            description.className = "description-subtext";
            description.textContent =
                job.description || "No description available.";

            content.append(title, details, description);

            const applyButton = document.createElement("button");
            applyButton.type = "button";
            applyButton.className = "btn-gradient";
            applyButton.textContent = "Apply Now";

            const openJob = () => {
                window.location.href =
                    `view_joblist.html?id=${encodeURIComponent(job.id)}`;
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
                event.stopPropagation();
                openJob();
            });

            card.append(iconCircle, content, applyButton);
            jobsContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Error fetching job posts:", error);
        jobsContainer.textContent = error.message;
    }
}

// ========================================
// CAROUSEL NAVIGATION
// ========================================

nextBtn?.addEventListener("click", () => {
    jobsContainer?.scrollBy({
        left: 320,
        behavior: "smooth"
    });
});

// ========================================
// INITIALIZE PAGE
// ========================================

loadProfile();
loadReviews();
loadCompanyJobs();
