/* ==========================================
   ADMIN PANEL LOGIC
========================================== */

const loginScreen = document.getElementById("loginScreen");
const dashboard = document.getElementById("dashboard");
const loginMsg = document.getElementById("loginMsg");
const dashMsg = document.getElementById("dashMsg");

function showMsg(el, text, type) {
    if (!el) return;
    el.innerHTML = '<div class="admin-msg ' + type + '">' + text + '</div>';
    setTimeout(function () { el.innerHTML = ""; }, 4000);
}

/* ---------- AUTH STATE ---------- */

async function checkSession() {
    if (typeof supabaseClient === "undefined" || !supabaseClient) return;

    try {
        const { data } = await supabaseClient.auth.getSession();
        if (data && data.session) {
            loginScreen.style.display = "none";
            dashboard.style.display = "block";
            loadSettings();
            loadPlans();
            loadApplications();
        } else {
            loginScreen.style.display = "block";
            dashboard.style.display = "none";
        }
    } catch (e) {
        console.error("Session check error:", e);
    }
}

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
    loginBtn.addEventListener("click", async function () {
        if (!supabaseClient) return;
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            showMsg(loginMsg, "Login failed: " + error.message, "error");
        } else {
            checkSession();
        }
    });
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
        if (!supabaseClient) return;
        await supabaseClient.auth.signOut();
        checkSession();
    });
}

checkSession();

/* ---------- SITE SETTINGS ---------- */

const DEFAULT_ADMIN_WA = "919785894756";

async function loadSettings() {
    let data = {};
    if (supabaseClient) {
        try {
            const res = await supabaseClient
                .from("site_settings")
                .select("*")
                .eq("id", 1)
                .single();
            if (!res.error && res.data) data = res.data;
        } catch (e) {}
    }

    let local = null;
    try {
        const stored = localStorage.getItem("neha_site_settings");
        if (stored) local = JSON.parse(stored);
    } catch (e) {}

    const combined = Object.assign({}, data, local || {});
    let wa = combined.whatsapp_number;
    if (!wa || wa === "917690929314") {
        wa = DEFAULT_ADMIN_WA;
    }

    document.getElementById("settingsWhatsapp").value = wa;
    document.getElementById("settingsTelegram").value = combined.telegram_channel_link || "https://t.me/Nehabookpublication02";
    document.getElementById("settingsWaGroup").value = combined.whatsapp_group_link || "";
    document.getElementById("settingsApply").value = combined.apply_now_link || "Hi, I want to apply for the handwriting project.";
}

const saveSettingsBtn = document.getElementById("saveSettingsBtn");
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", async function () {
        const payload = {
            whatsapp_number: document.getElementById("settingsWhatsapp").value.trim() || DEFAULT_ADMIN_WA,
            telegram_channel_link: document.getElementById("settingsTelegram").value.trim(),
            whatsapp_group_link: document.getElementById("settingsWaGroup").value.trim(),
            apply_now_link: document.getElementById("settingsApply").value.trim(),
            updated_at: new Date().toISOString()
        };

        // Always save to localStorage so changes take effect immediately
        try {
            localStorage.setItem("neha_site_settings", JSON.stringify(payload));
        } catch (e) {}

        if (supabaseClient) {
            const { error } = await supabaseClient
                .from("site_settings")
                .update(payload)
                .eq("id", 1);

            if (error) {
                showMsg(dashMsg, "Saved locally! (Database sync notice: " + error.message + ")", "success");
                return;
            }
        }

        showMsg(dashMsg, "Settings saved. Website will show new links immediately.", "success");
    });
}

/* ---------- PROJECT PLANS ---------- */

const plansContainer = document.getElementById("plansContainer");
let plansCache = [];

async function loadPlans() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
        .from("project_plans")
        .select("*")
        .order("sort_order", { ascending: true });

    if (error) {
        showMsg(dashMsg, "Could not load plans: " + error.message, "error");
        return;
    }

    plansCache = data || [];
    renderPlans();
}

function renderPlans() {
    if (!plansContainer) return;

    plansContainer.innerHTML = plansCache.map(function (plan, idx) {
        return (
            '<div class="admin-plan-row" data-id="' + plan.id + '">' +
                field("Badge (e.g. 7 Day Project)", "badge", plan.badge, idx) +
                field("Salary (e.g. ₹25,000 Salary)", "salary_amount", plan.salary_amount, idx) +
                field("Total Pages", "total_pages", plan.total_pages, idx) +
                field("Pages Per Day", "pages_per_day", plan.pages_per_day, idx) +
                field("Writing Side", "writing_side", plan.writing_side, idx) +
                field("Registration Fee", "registration_fee", plan.registration_fee, idx) +
                field("Apply Link (optional, else WhatsApp is used)", "apply_link", plan.apply_link, idx) +
                field("Sort Order (number)", "sort_order", plan.sort_order, idx) +
                '<div class="full-row admin-field">' +
                    '<label><input type="checkbox" class="plan-featured" data-idx="' + idx + '" ' + (plan.is_featured ? "checked" : "") + '> Mark as "Featured/Green Border"</label>' +
                '</div>' +
                '<div class="full-row admin-field">' +
                    '<label><input type="checkbox" class="plan-active" data-idx="' + idx + '" ' + (plan.is_active ? "checked" : "") + '> Active (visible on website)</label>' +
                '</div>' +
                '<div class="row-actions">' +
                    '<button class="admin-btn save-plan-btn" data-idx="' + idx + '">Save</button>' +
                    '<button class="admin-btn danger delete-plan-btn" data-idx="' + idx + '">Delete</button>' +
                '</div>' +
            '</div>'
        );
    }).join("");

    attachPlanEvents();
}

function field(label, key, value, idx) {
    return (
        '<div class="admin-field">' +
            '<label>' + label + '</label>' +
            '<input type="text" class="plan-field" data-key="' + key + '" data-idx="' + idx + '" value="' + (value !== null && value !== undefined ? String(value).replace(/"/g, "&quot;") : "") + '">' +
        '</div>'
    );
}

function attachPlanEvents() {
    document.querySelectorAll(".save-plan-btn").forEach(function (btn) {
        btn.addEventListener("click", async function () {
            if (!supabaseClient) return;
            const idx = Number(btn.getAttribute("data-idx"));
            const plan = plansCache[idx];

            const row = btn.closest(".admin-plan-row");
            const updated = {};
            row.querySelectorAll(".plan-field").forEach(function (input) {
                updated[input.getAttribute("data-key")] = input.value;
            });
            updated.is_featured = row.querySelector(".plan-featured").checked;
            updated.is_active = row.querySelector(".plan-active").checked;
            updated.sort_order = Number(updated.sort_order) || 0;
            updated.updated_at = new Date().toISOString();

            const { error } = await supabaseClient
                .from("project_plans")
                .update(updated)
                .eq("id", plan.id);

            if (error) {
                showMsg(dashMsg, "Save failed: " + error.message, "error");
            } else {
                showMsg(dashMsg, "Plan saved successfully.", "success");
                loadPlans();
            }
        });
    });

    document.querySelectorAll(".delete-plan-btn").forEach(function (btn) {
        btn.addEventListener("click", async function () {
            if (!supabaseClient) return;
            const idx = Number(btn.getAttribute("data-idx"));
            const plan = plansCache[idx];

            if (!confirm("Delete this plan? This cannot be undone.")) return;

            const { error } = await supabaseClient
                .from("project_plans")
                .delete()
                .eq("id", plan.id);

            if (error) {
                showMsg(dashMsg, "Delete failed: " + error.message, "error");
            } else {
                showMsg(dashMsg, "Plan deleted.", "success");
                loadPlans();
            }
        });
    });
}

const addPlanBtn = document.getElementById("addPlanBtn");
if (addPlanBtn) {
    addPlanBtn.addEventListener("click", async function () {
        if (!supabaseClient) return;

        const { error } = await supabaseClient
            .from("project_plans")
            .insert({
                badge: "New Plan",
                salary_amount: "₹25,000 Salary",
                total_pages: "Write 100 Pages",
                pages_per_day: "14 Pages Per Day",
                writing_side: "Front Side Writing Only",
                registration_fee: "Registration Fee: ₹499",
                is_active: true,
                is_featured: false,
                sort_order: plansCache.length + 1
            });

        if (error) {
            showMsg(dashMsg, "Could not add plan: " + error.message, "error");
        } else {
            showMsg(dashMsg, "New plan added — edit its details below.", "success");
            loadPlans();
        }
    });
}

/* ---------- CANDIDATE APPLICATIONS ---------- */

function loadApplications() {
    const container = document.getElementById("applicationsContainer");
    if (!container) return;

    let apps = [];
    try {
        const stored = localStorage.getItem("nbp_candidate_applications");
        if (stored) apps = JSON.parse(stored);
        if (!Array.isArray(apps)) apps = [];
    } catch (_) {}

    if (apps.length === 0) {
        container.innerHTML = '<p style="color: #666; font-size: 14px; padding: 10px 0;">No candidate applications received yet.</p>';
        return;
    }

    container.innerHTML =
        '<div style="overflow-x: auto;">' +
        '<table style="width: 100%; border-collapse: collapse; font-size: 14px; text-align: left;">' +
            '<thead>' +
                '<tr style="background: #1E3A5F; color: #fff;">' +
                    '<th style="padding: 10px 12px; border-radius: 6px 0 0 0;">Date</th>' +
                    '<th style="padding: 10px 12px;">Candidate Name</th>' +
                    '<th style="padding: 10px 12px;">Mobile</th>' +
                    '<th style="padding: 10px 12px;">City</th>' +
                    '<th style="padding: 10px 12px;">Project</th>' +
                    '<th style="padding: 10px 12px;">Salary</th>' +
                    '<th style="padding: 10px 12px; border-radius: 0 6px 0 0;">Action</th>' +
                '</tr>' +
            '</thead>' +
            '<tbody>' +
                apps.map(function (item, index) {
                    const rowBg = index % 2 === 0 ? "#ffffff" : "#f9fbfd";
                    const cleanPhone = (item.phone || "").replace(/[^0-9]/g, "");
                    const waText = encodeURIComponent("Hi " + (item.name || "Candidate") + ", this is Neha Book Publication regarding your application for " + (item.project || "handwriting job") + ".");
                    const waLink = "https://wa.me/91" + cleanPhone + "?text=" + waText;

                    return (
                        '<tr style="background: ' + rowBg + '; border-bottom: 1px solid #e5e7eb;">' +
                            '<td style="padding: 10px 12px; color: #666; font-size: 13px;">' + (item.applied_at || "Recent") + '</td>' +
                            '<td style="padding: 10px 12px; font-weight: 600; color: #1E3A5F;">' + (item.name || "-") + '</td>' +
                            '<td style="padding: 10px 12px;">+91 ' + (item.phone || "-") + '</td>' +
                            '<td style="padding: 10px 12px; color: #555;">' + (item.city || "-") + '</td>' +
                            '<td style="padding: 10px 12px;"><span style="background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">' + (item.project || "-") + '</span></td>' +
                            '<td style="padding: 10px 12px; font-weight: 600; color: #00b562;">' + (item.salary || "-") + '</td>' +
                            '<td style="padding: 10px 12px;">' +
                                '<a href="' + waLink + '" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #25D366; color: #fff; text-decoration: none; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">WhatsApp</a>' +
                            '</td>' +
                        '</tr>'
                    );
                }).join("") +
            '</tbody>' +
        '</table>' +
        '</div>';
}

const clearApplicationsBtn = document.getElementById("clearApplicationsBtn");
if (clearApplicationsBtn) {
    clearApplicationsBtn.addEventListener("click", function () {
        if (confirm("Are you sure you want to clear all candidate application records?")) {
            localStorage.removeItem("nbp_candidate_applications");
            loadApplications();
            showMsg(dashMsg, "Candidate applications cleared.", "success");
        }
    });
}
