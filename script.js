/* ==========================
   FRAUD ALERT POPUP SCRIPT
========================== */

// Website open hone ke 3 second baad popup open hoga
window.addEventListener("load", function () {
    setTimeout(function () {
        const popup = document.getElementById("fraudPopup");
        if (popup) {
            popup.classList.add("show");
        }
    }, 3000);
});

/* ==========================
   CLOSE POPUP
========================== */
function closePopup() {
    const popup = document.getElementById("fraudPopup");
    if (popup) {
        popup.classList.remove("show");
    }
}

/* ==========================
   LANGUAGE SWITCHER
========================== */
document.addEventListener("DOMContentLoaded", function () {
    const englishBtn = document.getElementById("englishBtn");
    const hindiBtn = document.getElementById("hindiBtn");
    const englishContent = document.getElementById("englishContent");
    const hindiContent = document.getElementById("hindiContent");

    if (englishBtn && hindiBtn && englishContent && hindiContent) {
        englishBtn.addEventListener("click", function () {
            englishContent.style.display = "block";
            hindiContent.style.display = "none";
            englishBtn.classList.add("active");
            hindiBtn.classList.remove("active");
        });

        hindiBtn.addEventListener("click", function () {
            englishContent.style.display = "none";
            hindiContent.style.display = "block";
            hindiBtn.classList.add("active");
            englishBtn.classList.remove("active");
        });
    }

    // Close popup on outside backdrop click
    window.addEventListener("click", function (event) {
        const popup = document.getElementById("fraudPopup");
        if (event.target === popup) {
            popup.classList.remove("show");
        }
    });

    /* ==========================================
       MOBILE NAVIGATION MENU
    ========================================== */
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", function () {
            navMenu.classList.toggle("active");
            menuToggle.innerHTML = navMenu.classList.contains("active") ? "✕" : "☰";
        });
    }

    // Auto close mobile menu after clicking link
    const navLinks = document.querySelectorAll(".nav-menu a");
    navLinks.forEach(function (link) {
        link.addEventListener("click", function () {
            if (window.innerWidth <= 768 && navMenu) {
                navMenu.classList.remove("active");
                if (menuToggle) {
                    menuToggle.innerHTML = "☰";
                }
            }
        });
    });

    /* ==========================================
       FAQ ACCORDION INTERACTION
    ========================================== */
    const faqQuestions = document.querySelectorAll(".faq-question");

    faqQuestions.forEach(function (question) {
        question.addEventListener("click", function () {
            const currentItem = this.parentElement;
            const currentIcon = this.querySelector(".faq-icon");

            // Close all other FAQs
            faqQuestions.forEach(function (item) {
                const faqItem = item.parentElement;
                const icon = item.querySelector(".faq-icon");
                if (faqItem !== currentItem) {
                    faqItem.classList.remove("active");
                    if (icon) icon.textContent = "+";
                }
            });

            // Toggle Current FAQ
            currentItem.classList.toggle("active");
            if (currentIcon) {
                currentIcon.textContent = currentItem.classList.contains("active") ? "−" : "+";
            }
        });
    });

    /* ==========================================
       SCROLL ANIMATIONS (INTERSECTION OBSERVER)
    ========================================== */
    const setupObserver = function (selector, hiddenClass, showClass, stagger = 0) {
        const elements = document.querySelectorAll(selector);
        if (!elements.length) return;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add(showClass);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        elements.forEach(function (el, index) {
            el.classList.add(hiddenClass);
            if (stagger > 0) {
                el.style.transitionDelay = (index * stagger) + "s";
            }
            observer.observe(el);
        });
    };

    setupObserver(".step-card", "hidden-animation", "show-animation");
    setupObserver(".trust-card", "hidden-animation", "show-animation");
    setupObserver(".about-content, .mission-card, .vision-card, .stat-card", "about-hidden", "about-show");
    setupObserver(".review-card", "review-hidden", "review-show", 0.08);
    setupObserver(".contact-card", "contact-hidden", "contact-show", 0.08);
    setupObserver(".privacy-card", "privacy-hidden", "privacy-show", 0.08);
    setupObserver(".terms-card", "terms-hidden", "terms-show", 0.08);
    setupObserver(".footer-column", "footer-hidden", "footer-show", 0.1);

    /* Button Click Effects */
    const attachButtonEffect = function (selector, effectClass, timeout) {
        document.querySelectorAll(selector).forEach(function (btn) {
            btn.addEventListener("click", function () {
                btn.classList.add(effectClass);
                setTimeout(function () {
                    btn.classList.remove(effectClass);
                }, timeout);
            });
        });
    };

    attachButtonEffect(".project-btn", "clicked", 300);
    attachButtonEffect(".contact-btn", "contact-clicked", 200);

    /* Smooth Scroll for Footer Links */
    document.querySelectorAll('.footer a[href^="#"]').forEach(function (link) {
        link.addEventListener("click", function (e) {
            const targetId = this.getAttribute("href");
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                e.preventDefault();
                targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
});

/* ==========================================
   LIVE CONTENT & PLANS (SUPABASE + FALLBACK)
========================================== */

const DEFAULT_PLANS = [
    {
        badge: "7 Day Project",
        salary_amount: "₹25,000 Salary",
        total_pages: "Write 100 Pages",
        pages_per_day: "14 Pages Per Day",
        writing_side: "Front Side Writing Only",
        registration_fee: "Registration Fee: ₹499",
        is_featured: false
    },
    {
        badge: "10 Day Project",
        salary_amount: "₹30,000 Salary",
        total_pages: "Write 160 Pages",
        pages_per_day: "16 Pages Per Day",
        writing_side: "Front Side Writing Only",
        registration_fee: "Registration Fee: ₹750",
        is_featured: false
    },
    {
        badge: "12 Day Project",
        salary_amount: "₹35,000 Salary",
        total_pages: "Write 200 Pages",
        pages_per_day: "17 Pages Per Day",
        writing_side: "Front Side Writing Only",
        registration_fee: "Registration Fee: ₹1199",
        is_featured: false
    },
    {
        badge: "15 Day Project",
        salary_amount: "₹40,000 Salary",
        total_pages: "Write 300 Pages",
        pages_per_day: "20 Pages Per Day",
        writing_side: "Front & Back Side Writing",
        registration_fee: "Registration Fee: ₹1499",
        is_featured: false
    }
];

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

const OFFICIAL_WA_NUMBER = "919785894756";
const OFFICIAL_WA_DISPLAY = "+91 97858 94756";

function formatWaNumber(num) {
    const d = (num || "").replace(/[^0-9]/g, "");
    if (d.length === 12 && d.startsWith("91")) {
        return "+91 " + d.slice(2, 7) + " " + d.slice(7);
    } else if (d.length === 10) {
        return "+91 " + d.slice(0, 5) + " " + d.slice(5);
    }
    return d ? "+" + d : OFFICIAL_WA_DISPLAY;
}

function renderProjectPlans(plans, waDigits) {
    const grid = document.getElementById("projectsGrid");
    if (!grid) return;

    const defaultApplyLink = grid.getAttribute("data-default-apply-link") || ("https://wa.me/" + OFFICIAL_WA_NUMBER + "?text=" + encodeURIComponent("Hi, I want to apply for the handwriting project."));

    grid.innerHTML = plans.map(function (plan) {
        const featuredClass = plan.is_featured ? " featured-plan" : "";
        const badgeSlug = encodeURIComponent((plan.badge || "project").toLowerCase().replace(/\s+/g, "-"));
        const badgeText = encodeURIComponent(plan.badge || "");
        const salaryText = encodeURIComponent(plan.salary_amount || "");
        const applyLink = "./login.html?project=" + badgeSlug + "&badge=" + badgeText + "&salary=" + salaryText;

        return (
            '<div class="project-card' + featuredClass + '">' +
                '<div class="project-badge">' + escapeHtml(plan.badge || "") + '</div>' +
                '<h3>' + escapeHtml(plan.salary_amount || "") + '</h3>' +
                '<ul>' +
                    (plan.total_pages ? '<li>📝 ' + escapeHtml(plan.total_pages) + '</li>' : '') +
                    (plan.pages_per_day ? '<li>📄 ' + escapeHtml(plan.pages_per_day) + '</li>' : '') +
                    (plan.writing_side ? '<li>➡️ ' + escapeHtml(plan.writing_side) + '</li>' : '') +
                    (plan.registration_fee ? '<li>💳 ' + escapeHtml(plan.registration_fee) + '</li>' : '') +
                '</ul>' +
                '<a href="' + applyLink + '" class="project-btn js-apply-link">Apply Now</a>' +
            '</div>'
        );
    }).join("");

    // Initialize animations on newly injected cards
    const newCards = grid.querySelectorAll(".project-card");
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("show-card");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    newCards.forEach(function (card) {
        card.classList.add("hide-card");
        observer.observe(card);
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    // Check if custom settings are stored locally in browser
    let localSettings = null;
    try {
        const stored = localStorage.getItem("neha_site_settings");
        if (stored) localSettings = JSON.parse(stored);
    } catch (e) {}

    const initialWa = (localSettings && localSettings.whatsapp_number) || OFFICIAL_WA_NUMBER;

    // Render default plans immediately so user never sees blank or empty plans
    renderProjectPlans(DEFAULT_PLANS, initialWa);

    /* ---------- SITE SETTINGS ---------- */
    try {
        let settings = null;
        if (typeof supabaseClient !== "undefined" && supabaseClient) {
            const { data, error } = await supabaseClient
                .from("site_settings")
                .select("*")
                .eq("id", 1)
                .single();

            if (!error && data) settings = data;
        }

        // Merge with localSettings if any
        if (localSettings) {
            settings = Object.assign({}, settings || {}, localSettings);
        }

        // Active WhatsApp number: if remote is the old demo number "917690929314" or empty, use OFFICIAL_WA_NUMBER
        let activeWa = OFFICIAL_WA_NUMBER;
        if (settings && settings.whatsapp_number && settings.whatsapp_number !== "917690929314") {
            activeWa = settings.whatsapp_number;
        }

        const waDigits = activeWa.replace(/[^0-9]/g, "") || OFFICIAL_WA_NUMBER;
        const defaultWaMessage = (settings && settings.apply_now_link) || "Hi, I want to apply for the handwriting project.";
        const waLink = "https://wa.me/" + waDigits + "?text=" + encodeURIComponent(defaultWaMessage);
        const waDisplay = formatWaNumber(waDigits);

        // WhatsApp links (WhatsApp Us, Chat on WhatsApp, Floating WhatsApp)
        document.querySelectorAll(".js-whatsapp-link").forEach(function (el) {
            el.setAttribute("href", waLink);
        });

        // WhatsApp number text
        document.querySelectorAll(".js-wa-number-text").forEach(function (el) {
            el.textContent = waDisplay;
        });

        // Telegram links
        const tgLink = (settings && settings.telegram_channel_link) || "https://t.me/Nehabookpublication02";
        document.querySelectorAll(".js-telegram-link").forEach(function (el) {
            el.setAttribute("href", tgLink);
        });
        document.querySelectorAll(".js-tg-handle-text").forEach(function (el) {
            el.textContent = tgLink.replace(/^https?:\/\//, "");
        });

        // Apply Now links
        window.__waDigitsForApply = waDigits;
        window.__waApplyMessage = defaultWaMessage;

        document.querySelectorAll(".js-apply-link").forEach(function (el) {
            const currentHref = el.getAttribute("href") || "";
            if (!currentHref.includes("login.html")) {
                el.setAttribute("href", "./login.html?project=general");
            }
            el.removeAttribute("target");
        });

        // WhatsApp Group card
        const waGroupCard = document.getElementById("whatsappGroupCard");
        if (waGroupCard && settings && settings.whatsapp_group_link) {
            waGroupCard.style.display = "";
            const waGroupLink = waGroupCard.querySelector(".js-whatsapp-group-link");
            if (waGroupLink) waGroupLink.setAttribute("href", settings.whatsapp_group_link);
        }
    } catch (e) {
        console.warn("Site settings load warning:", e);
    }

    /* ---------- PROJECT PLANS ---------- */
    try {
        if (typeof supabaseClient !== "undefined" && supabaseClient) {
            const { data: plans, error } = await supabaseClient
                .from("project_plans")
                .select("*")
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

            if (!error && plans && plans.length > 0) {
                renderProjectPlans(plans, window.__waDigitsForApply || OFFICIAL_WA_NUMBER);
            }
        }
    } catch (e) {
        console.warn("Live plans fetch warning:", e);
    }
});
