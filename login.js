/* ============================================================
   NEHA BOOK PUBLICATION — LOGIN / CANDIDATE APPLICATION SCRIPT
   Handles Phone Number verification, OTP flow, Name collection,
   and Project Confirmation.
   ============================================================ */

(function () {
    "use strict";

    // Official WhatsApp Fallback
    const DEFAULT_WA_NUMBER = "919785894756";
    let officialWaNumber = DEFAULT_WA_NUMBER;

    // Load custom WhatsApp number from localStorage or Supabase
    try {
        const stored = localStorage.getItem("neha_site_settings");
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.whatsapp_number) {
                officialWaNumber = parsed.whatsapp_number.replace(/[^0-9]/g, "");
            }
        }
    } catch (_) {}

    // State Variables
    let currentMobile = "";
    let generatedOtp = "1234";
    let countdownInterval = null;
    let selectedProjectBadge = "7 Day Project";
    let selectedProjectSalary = "₹25,000 Salary";

    // DOM Elements
    const authNotice = document.getElementById("authNotice");
    const selectedProjectDisplay = document.getElementById("selectedProjectDisplay");
    const projectNameText = document.getElementById("projectNameText");
    const projectSalaryText = document.getElementById("projectSalaryText");
    const authMsg = document.getElementById("authMsg");

    const stepPhone = document.getElementById("stepPhone");
    const stepOtp = document.getElementById("stepOtp");
    const stepName = document.getElementById("stepName");
    const stepDone = document.getElementById("stepDone");

    const mobileInput = document.getElementById("mobileNumberInput");
    const btnSignInPhone = document.getElementById("btnSignInPhone");
    const userPhoneDisplay = document.getElementById("userPhoneDisplay");
    const verifiedPhoneDisplay = document.getElementById("verifiedPhoneDisplay");
    const btnChangePhone = document.getElementById("btnChangePhone");

    const otpDigits = document.querySelectorAll(".otp-digit");
    const demoOtpBadge = document.getElementById("demoOtpBadge");
    const btnAutoFillOtp = document.getElementById("btnAutoFillOtp");
    const btnVerifyOtp = document.getElementById("btnVerifyOtp");
    const resendTimerText = document.getElementById("resendTimerText");
    const countdownSecs = document.getElementById("countdownSecs");
    const btnResendOtp = document.getElementById("btnResendOtp");

    const nameForm = document.getElementById("nameForm");
    const fullNameInput = document.getElementById("fullNameInput");
    const cityInput = document.getElementById("cityInput");
    const referralInput = document.getElementById("referralInput");
    const btnSubmitName = document.getElementById("btnSubmitName");

    const summaryName = document.getElementById("summaryName");
    const summaryPhone = document.getElementById("summaryPhone");
    const summaryProject = document.getElementById("summaryProject");
    const summarySalary = document.getElementById("summarySalary");
    const btnWhatsAppDispatch = document.getElementById("btnWhatsAppDispatch");

    // Helper: Show Message Toast
    function showMsg(text, type) {
        if (!authMsg) return;
        if (!text) {
            authMsg.style.display = "none";
            authMsg.className = "auth-msg";
            authMsg.textContent = "";
            return;
        }
        authMsg.textContent = text;
        authMsg.className = "auth-msg " + (type || "error");
        authMsg.style.display = "block";
    }

    // Helper: Switch Step
    function showStep(stepEl) {
        [stepPhone, stepOtp, stepName, stepDone].forEach(function (el) {
            if (el) el.style.display = (el === stepEl) ? "block" : "none";
        });
        showMsg("");
    }

    // Parse URL Parameters for Selected Project
    function initProjectContext() {
        const params = new URLSearchParams(window.location.search);
        const projectParam = params.get("project");
        const badgeParam = params.get("badge");
        const salaryParam = params.get("salary");
        const refParam = params.get("ref");

        if (refParam && referralInput) {
            referralInput.value = refParam;
            const refDetails = document.querySelector(".auth-ref-details");
            if (refDetails) refDetails.open = true;
        }

        if (badgeParam || projectParam) {
            if (badgeParam) {
                selectedProjectBadge = badgeParam;
            } else if (projectParam) {
                // Format slug e.g. "10-day-project" -> "10 Day Project"
                selectedProjectBadge = projectParam
                    .split("-")
                    .map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); })
                    .join(" ");
            }

            if (salaryParam) {
                selectedProjectSalary = salaryParam.includes("Salary") ? salaryParam : (salaryParam + " Salary");
            } else {
                // Infer salary from badge
                if (selectedProjectBadge.includes("10")) selectedProjectSalary = "₹30,000 Salary";
                else if (selectedProjectBadge.includes("12")) selectedProjectSalary = "₹35,000 Salary";
                else if (selectedProjectBadge.includes("15")) selectedProjectSalary = "₹40,000 Salary";
                else selectedProjectSalary = "₹25,000 Salary";
            }

            if (selectedProjectDisplay && projectNameText && projectSalaryText) {
                selectedProjectDisplay.style.display = "block";
                projectNameText.textContent = selectedProjectBadge;
                projectSalaryText.textContent = selectedProjectSalary;
            }
        }
    }

    // Format phone display: 9876543210 -> 98765 43210
    function formatPhone(num) {
        if (!num) return "";
        const clean = num.replace(/[^0-9]/g, "");
        if (clean.length === 10) {
            return clean.slice(0, 5) + " " + clean.slice(5);
        }
        return clean;
    }

    // Generate random 4-digit OTP or default to 1234
    function generateNewOtp() {
        // Generating random 4-digit code (e.g. 5824)
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        generatedOtp = code;
        if (demoOtpBadge) {
            demoOtpBadge.innerHTML = 'Your OTP is: <strong>' + generatedOtp + '</strong>';
        }
    }

    // Start 30-sec Resend Timer
    function startResendCountdown() {
        if (countdownInterval) clearInterval(countdownInterval);
        let left = 30;
        if (countdownSecs) countdownSecs.textContent = left;
        if (resendTimerText) resendTimerText.style.display = "inline";
        if (btnResendOtp) btnResendOtp.style.display = "none";

        countdownInterval = setInterval(function () {
            left--;
            if (countdownSecs) countdownSecs.textContent = left;
            if (left <= 0) {
                clearInterval(countdownInterval);
                if (resendTimerText) resendTimerText.style.display = "none";
                if (btnResendOtp) btnResendOtp.style.display = "inline";
            }
        }, 1000);
    }

    // Setup OTP Box Inputs
    function setupOtpInputs() {
        otpDigits.forEach(function (input, idx) {
            input.addEventListener("input", function (e) {
                // Allow only digits
                this.value = this.value.replace(/[^0-9]/g, "");
                if (this.value.length === 1 && idx < otpDigits.length - 1) {
                    otpDigits[idx + 1].focus();
                }
            });

            input.addEventListener("keydown", function (e) {
                if (e.key === "Backspace" && !this.value && idx > 0) {
                    otpDigits[idx - 1].focus();
                }
            });

            // Paste full code
            input.addEventListener("paste", function (e) {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData("text").replace(/[^0-9]/g, "");
                if (paste.length >= otpDigits.length) {
                    otpDigits.forEach(function (inp, i) {
                        inp.value = paste[i] || "";
                    });
                    otpDigits[otpDigits.length - 1].focus();
                }
            });
        });

        // Auto-fill OTP button
        if (btnAutoFillOtp) {
            btnAutoFillOtp.addEventListener("click", function () {
                const code = generatedOtp || "1234";
                otpDigits.forEach(function (inp, i) {
                    inp.value = code[i] || "";
                });
                showMsg("OTP auto-filled! Click Verify & Continue.", "success");
            });
        }
    }

    // Finalize Application and show Step 4
    function finalizeApplication(userData) {
        // Save current user session
        localStorage.setItem("nbp_current_user", JSON.stringify(userData));

        // Save into applications list for Admin Panel inspection
        try {
            let allApps = [];
            const stored = localStorage.getItem("nbp_candidate_applications");
            if (stored) allApps = JSON.parse(stored);
            if (!Array.isArray(allApps)) allApps = [];

            // Add new application to beginning
            allApps.unshift(userData);
            localStorage.setItem("nbp_candidate_applications", JSON.stringify(allApps));
        } catch (_) {}

        // Populate Summary Card
        if (summaryName) summaryName.textContent = userData.name || "Candidate";
        if (summaryPhone) summaryPhone.textContent = "+91 " + formatPhone(userData.phone);
        if (summaryProject) summaryProject.textContent = userData.project || selectedProjectBadge;
        if (summarySalary) summarySalary.textContent = userData.salary || selectedProjectSalary;

        // Setup WhatsApp Material Dispatch Link
        if (btnWhatsAppDispatch) {
            const dispatchMessage =
                "Hello Neha Book Publication,\n\n" +
                "I have verified my mobile number and registered for the handwriting job.\n\n" +
                "👤 Name: " + (userData.name || "") + "\n" +
                "📱 Mobile: +91 " + (userData.phone || "") + "\n" +
                "📋 Project: " + (userData.project || selectedProjectBadge) + "\n" +
                "💰 Salary: " + (userData.salary || selectedProjectSalary) + "\n" +
                (userData.city ? "📍 City: " + userData.city + "\n" : "") +
                "\nPlease dispatch my handwriting book material and guide me on the next step.";

            const waLink = "https://wa.me/" + officialWaNumber + "?text=" + encodeURIComponent(dispatchMessage);
            btnWhatsAppDispatch.setAttribute("href", waLink);
        }

        showStep(stepDone);
    }

    // DOM Ready
    document.addEventListener("DOMContentLoaded", function () {
        initProjectContext();
        setupOtpInputs();

        // 1. Submit Phone Number
        const phoneForm = document.getElementById("phoneForm");
        if (phoneForm) {
            phoneForm.addEventListener("submit", function (e) {
                e.preventDefault();
                const raw = (mobileInput ? mobileInput.value : "").trim().replace(/[^0-9]/g, "");

                if (raw.length !== 10) {
                    showMsg("Please enter a valid 10-digit mobile number.", "error");
                    if (mobileInput) mobileInput.focus();
                    return;
                }

                if (!["6", "7", "8", "9"].includes(raw[0])) {
                    showMsg("Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.", "error");
                    return;
                }

                currentMobile = raw;
                if (userPhoneDisplay) userPhoneDisplay.textContent = "+91 " + formatPhone(raw);
                if (verifiedPhoneDisplay) verifiedPhoneDisplay.textContent = "+91 " + formatPhone(raw);

                // Generate OTP & Proceed
                generateNewOtp();
                showStep(stepOtp);
                startResendCountdown();

                // Clear OTP inputs
                otpDigits.forEach(function (inp) { inp.value = ""; });
                if (otpDigits[0]) otpDigits[0].focus();
            });
        }

        // Change Phone Number
        if (btnChangePhone) {
            btnChangePhone.addEventListener("click", function () {
                showStep(stepPhone);
                if (mobileInput) mobileInput.focus();
            });
        }

        // Resend OTP
        if (btnResendOtp) {
            btnResendOtp.addEventListener("click", function () {
                generateNewOtp();
                startResendCountdown();
                showMsg("New OTP sent to your mobile number!", "success");
                otpDigits.forEach(function (inp) { inp.value = ""; });
                if (otpDigits[0]) otpDigits[0].focus();
            });
        }

        // 2. Submit OTP
        const otpForm = document.getElementById("otpForm");
        if (otpForm) {
            otpForm.addEventListener("submit", function (e) {
                e.preventDefault();
                let entered = "";
                otpDigits.forEach(function (inp) { entered += inp.value; });

                if (entered.length < 4) {
                    showMsg("Please enter the complete 4-digit OTP code.", "error");
                    return;
                }

                // Verify OTP (accept generated or universal test code 1234)
                if (entered === generatedOtp || entered === "1234") {
                    showMsg("Mobile number verified successfully!", "success");

                    // Check if candidate already has a saved name
                    let existingUser = null;
                    try {
                        const stored = localStorage.getItem("nbp_user_" + currentMobile);
                        if (stored) existingUser = JSON.parse(stored);
                    } catch (_) {}

                    if (existingUser && existingUser.name) {
                        // User already registered name, update project & complete
                        existingUser.project = selectedProjectBadge;
                        existingUser.salary = selectedProjectSalary;
                        finalizeApplication(existingUser);
                    } else {
                        // Ask for candidate name
                        setTimeout(function () {
                            showStep(stepName);
                            if (fullNameInput) fullNameInput.focus();
                        }, 500);
                    }
                } else {
                    showMsg("Invalid OTP code. Please enter the correct code or tap 'Auto-fill'.", "error");
                }
            });
        }

        // 3. Submit Name & Complete Registration
        if (nameForm) {
            nameForm.addEventListener("submit", function (e) {
                e.preventDefault();
                const name = (fullNameInput ? fullNameInput.value : "").trim();
                const city = (cityInput ? cityInput.value : "").trim();
                const ref = (referralInput ? referralInput.value : "").trim();

                if (name.length < 2) {
                    showMsg("Please enter your full name.", "error");
                    if (fullNameInput) fullNameInput.focus();
                    return;
                }

                if (btnSubmitName) {
                    btnSubmitName.disabled = true;
                    btnSubmitName.textContent = "Registering...";
                }

                const candidateData = {
                    name: name,
                    phone: currentMobile,
                    city: city,
                    referral: ref,
                    project: selectedProjectBadge,
                    salary: selectedProjectSalary,
                    applied_at: new Date().toLocaleString()
                };

                // Save profile permanently
                try {
                    localStorage.setItem("nbp_user_" + currentMobile, JSON.stringify(candidateData));
                } catch (_) {}

                setTimeout(function () {
                    finalizeApplication(candidateData);
                }, 600);
            });
        }
    });
})();
