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
    let selectedProjectFee = "₹499";

    // 10-Minute QR Scanner Session Variables
    let qrTimerInterval = null;
    const QR_EXPIRY_MINUTES = 10;
    const QR_EXPIRY_MS = QR_EXPIRY_MINUTES * 60 * 1000;

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

            const feeParam = params.get("fee");
            if (feeParam) {
                selectedProjectFee = feeParam.replace(/Registration Fee:?\s*/i, "").trim();
            } else {
                if (selectedProjectBadge.includes("10")) selectedProjectFee = "₹750";
                else if (selectedProjectBadge.includes("12")) selectedProjectFee = "₹1199";
                else if (selectedProjectBadge.includes("15")) selectedProjectFee = "₹1499";
                else selectedProjectFee = "₹499";
            }

            if (selectedProjectDisplay && projectNameText && projectSalaryText) {
                selectedProjectDisplay.style.display = "block";
                projectNameText.textContent = selectedProjectBadge;
                projectSalaryText.textContent = selectedProjectSalary + " • Fee: " + selectedProjectFee;
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

    // 10-Minute QR Countdown Timer Function
    function startQrTimer(expiresAt) {
        if (qrTimerInterval) clearInterval(qrTimerInterval);

        const qrCountdown = document.getElementById("qrCountdown");
        const qrExpiredOverlay = document.getElementById("qrExpiredOverlay");
        const qrTimerBadge = document.getElementById("qrTimerBadge");

        function tick() {
            const remainingMs = expiresAt - Date.now();
            const remainingSecs = Math.max(0, Math.floor(remainingMs / 1000));

            const mins = Math.floor(remainingSecs / 60);
            const secs = remainingSecs % 60;
            const display = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");

            if (qrCountdown) qrCountdown.textContent = display;

            if (remainingSecs <= 0) {
                clearInterval(qrTimerInterval);
                if (qrExpiredOverlay) qrExpiredOverlay.style.display = "flex";
                if (qrTimerBadge) {
                    qrTimerBadge.style.background = "#fee2e2";
                    qrTimerBadge.style.color = "#991b1b";
                    qrTimerBadge.innerHTML = '<span class="timer-icon">⚠️</span> <span class="timer-text">QR Scanner Expired</span>';
                }
            } else {
                if (qrExpiredOverlay) qrExpiredOverlay.style.display = "none";
                if (qrTimerBadge) {
                    qrTimerBadge.style.background = "#fef2f2";
                    qrTimerBadge.style.color = "#b91c1c";
                    qrTimerBadge.innerHTML = '<span class="timer-icon">⏳</span> <span class="timer-text">QR Scanner Valid For: <strong id="qrCountdown">' + display + '</strong></span>';
                }
            }
        }

        tick();
        qrTimerInterval = setInterval(tick, 1000);
    }

    // Refresh / Renew Scanner for 10 minutes
    function renewQrScanner(userData) {
        const newExpiresAt = Date.now() + QR_EXPIRY_MS;
        const currentData = userData || (function () {
            try {
                const s = localStorage.getItem("nbp_active_qr_session");
                if (s) return JSON.parse(s).userData;
            } catch (_) {}
            return {};
        })();

        const session = {
            userData: currentData,
            expiresAt: newExpiresAt,
            createdAt: Date.now()
        };
        localStorage.setItem("nbp_active_qr_session", JSON.stringify(session));
        startQrTimer(newExpiresAt);
        showMsg("QR Scanner refreshed! 10-minute validity started.", "success");
    }

    // Finalize Application and show Step 4 (Scanner Screen)
    function finalizeApplication(userData, existingExpiresAt) {
        // Save current user session
        localStorage.setItem("nbp_current_user", JSON.stringify(userData));

        // Manage 10-minute expiry
        let expiresAt = existingExpiresAt;
        const now = Date.now();
        // If no expiry exists, or if expired and page was refreshed, generate fresh 10 mins!
        if (!expiresAt || expiresAt <= now) {
            expiresAt = now + QR_EXPIRY_MS;
        }

        // Save active session so on page refresh, scanner displays directly!
        const activeSession = {
            userData: userData,
            expiresAt: expiresAt,
            createdAt: now
        };
        localStorage.setItem("nbp_active_qr_session", JSON.stringify(activeSession));

        // Save into applications list for Admin Panel inspection
        try {
            let allApps = [];
            const stored = localStorage.getItem("nbp_candidate_applications");
            if (stored) allApps = JSON.parse(stored);
            if (!Array.isArray(allApps)) allApps = [];

            // Prevent duplicate entries of same phone/time
            const alreadyExists = allApps.some(function (a) {
                return a.phone === userData.phone && a.applied_at === userData.applied_at;
            });
            if (!alreadyExists) {
                allApps.unshift(userData);
                localStorage.setItem("nbp_candidate_applications", JSON.stringify(allApps));
            }
        } catch (_) {}

        // Populate Summary Card & QR Box
        if (summaryName) summaryName.textContent = userData.name || "Candidate";
        if (summaryPhone) summaryPhone.textContent = "+91 " + formatPhone(userData.phone);
        if (summaryProject) summaryProject.textContent = userData.project || selectedProjectBadge;
        if (summarySalary) summarySalary.textContent = userData.salary || selectedProjectSalary;

        const feeVal = userData.fee || selectedProjectFee || "₹499";
        const qrFeeAmount = document.getElementById("qrFeeAmount");
        const summaryFee = document.getElementById("summaryFee");
        if (qrFeeAmount) qrFeeAmount.textContent = feeVal;
        if (summaryFee) summaryFee.textContent = feeVal;

        // Setup WhatsApp Material Dispatch Link with Payment Details
        if (btnWhatsAppDispatch) {
            const dispatchMessage =
                "Hello Neha Book Publication,\n\n" +
                "I have registered for the handwriting job and I am sending the registration fee payment screenshot.\n\n" +
                "👤 Name: " + (userData.name || "") + "\n" +
                "📱 Mobile: +91 " + (userData.phone || "") + "\n" +
                "📋 Project: " + (userData.project || selectedProjectBadge) + "\n" +
                "💰 Salary: " + (userData.salary || selectedProjectSalary) + "\n" +
                "💳 Registration Fee: " + feeVal + "\n" +
                (userData.city ? "📍 Delivery City: " + userData.city + "\n" : "") +
                "\nPlease verify my payment and dispatch my handwriting project material.";

            const waLink = "https://wa.me/" + officialWaNumber + "?text=" + encodeURIComponent(dispatchMessage);
            btnWhatsAppDispatch.setAttribute("href", waLink);
        }

        // Start 10-minute live countdown timer
        startQrTimer(expiresAt);

        // Display QR Scanner Screen
        showStep(stepDone);
    }

    // DOM Ready
    document.addEventListener("DOMContentLoaded", function () {
        initProjectContext();
        setupOtpInputs();

        // Check if an active confirmed QR scanner session already exists in browser
        // (So refreshing the page directly shows the scanner!)
        try {
            const storedSession = localStorage.getItem("nbp_active_qr_session");
            if (storedSession) {
                const session = JSON.parse(storedSession);
                if (session && session.userData && session.userData.phone) {
                    // If URL explicitly selected a new plan, update project details
                    const urlParams = new URLSearchParams(window.location.search);
                    if (urlParams.get("badge") && urlParams.get("badge") !== session.userData.project) {
                        session.userData.project = selectedProjectBadge;
                        session.userData.salary = selectedProjectSalary;
                        session.userData.fee = selectedProjectFee;
                    }
                    finalizeApplication(session.userData, session.expiresAt);
                    // Attach scanner buttons
                    attachScannerEvents();
                    return;
                }
            }
        } catch (_) {}

        // Setup refresh scanner & reset buttons
        function attachScannerEvents() {
            const btnRefreshQr = document.getElementById("btnRefreshQr");
            if (btnRefreshQr && !btnRefreshQr.dataset.bound) {
                btnRefreshQr.dataset.bound = "true";
                btnRefreshQr.addEventListener("click", function () {
                    renewQrScanner();
                });
            }

            const btnResetSession = document.getElementById("btnResetSession");
            if (btnResetSession && !btnResetSession.dataset.bound) {
                btnResetSession.dataset.bound = "true";
                btnResetSession.addEventListener("click", function () {
                    if (confirm("Do you want to clear this session and apply with a new mobile number or name?")) {
                        localStorage.removeItem("nbp_active_qr_session");
                        if (qrTimerInterval) clearInterval(qrTimerInterval);
                        showStep(stepPhone);
                        if (mobileInput) {
                            mobileInput.value = "";
                            mobileInput.focus();
                        }
                    }
                });
            }
        }

        attachScannerEvents();

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
                        existingUser.fee = selectedProjectFee;
                        finalizeApplication(existingUser);
                        attachScannerEvents();
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
                    fee: selectedProjectFee,
                    applied_at: new Date().toLocaleString()
                };

                // Save profile permanently
                try {
                    localStorage.setItem("nbp_user_" + currentMobile, JSON.stringify(candidateData));
                } catch (_) {}

                setTimeout(function () {
                    finalizeApplication(candidateData);
                    attachScannerEvents();
                }, 600);
            });
        }
    });
})();
