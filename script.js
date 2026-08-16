// ==========================================
// 🛡️ PHASE 7: GLOBAL ERROR TRACKING
// ==========================================
window.addEventListener('error', function(event) {
    console.error("🚨 Frontend Crash Detected:", event.error);
    const payBtn = document.getElementById('pay-now-btn');
    if (payBtn && payBtn.disabled) {
        payBtn.innerText = "System Error - Try Again";
        payBtn.disabled = false;
    }
});

window.addEventListener('unhandledrejection', function(event) {
    console.error("🚨 Unhandled Promise Rejection:", event.reason);
});

// ==========================================
// 🧠 0. GLOBAL STATE
// ==========================================
window.magicalState = {
    partnerName: "",
    userName: "",
    envelopeMsg: "",
    envelopeQuestion: "", // 🚀 NEW: Tracks the selected envelope question
    mainWish: "",
    audioLink: "",
    images: { 0: null, 1: null, 2: null, 3: null },
    scratchMsgs: { 1: "", 2: "", 3: "", 4: "" }
};

// ==========================================
// 📸 1. PHOTO COMPRESSION & UPLOAD LOGIC
// ==========================================
async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                if (dataUrl === 'data:,') {
                    reject(new Error("Browser does not support canvas export."));
                } else {
                    resolve(dataUrl);
                }
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
// ==========================================
// 🚀 PHASE 1: SECURE CLOUD STORAGE (BACKEND PROXY)
// ==========================================
// API Key removed for security! Backend handles it now.

async function uploadToImgBB(base64Data) {
    // 🚀 PHASE 3 MAGIC: Bypassing ImgBB entirely!
    // We return the highly compressed Base64 image directly.
    // It will be saved securely into your free Cloudflare R2 bucket.
    return base64Data;
}

document.addEventListener('DOMContentLoaded', () => {
        // --- 🚀 NEW: RADIO PILL UI LOGIC ---
    const radioInputs = document.querySelectorAll('input[name="envelope_question"]');
    const customBox = document.getElementById('custom-question-box');
    
    radioInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            // Remove active class from all pills
            document.querySelectorAll('.radio-pill').forEach(pill => pill.classList.remove('active'));
            
            // Add active class to the selected parent label
            e.target.closest('.radio-pill').classList.add('active');
            
            // Show/Hide custom input box with 0-lag CSS display toggle
            if (e.target.value === 'custom') {
                customBox.style.display = 'flex';
                // Small trick to ensure focus
                setTimeout(() => document.getElementById('envelope-msg').focus(), 50);
            } else {
                customBox.style.display = 'none';
            }
        });
    });
    // --- PHOTO UPLOAD LOGIC (UPDATED FOR CLOUD STORAGE) ---
    const photoInputs = document.querySelectorAll('.photo-upload-box input[type="file"]');
    photoInputs.forEach((input, index) => {
        input.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                const parentLabel = input.parentElement;
                const plusIcon = parentLabel.querySelector('.upload-icon') || parentLabel.querySelector('span');
                
                // Show loading state so the user doesn't click twice
                if (plusIcon) plusIcon.innerText = "⏳"; 
                parentLabel.style.pointerEvents = "none"; // Prevent form bugs from double-clicking

                try {
                    // 1. Compress image locally (Saves user data)
                    const base64Data = await compressImage(file);
                    
                    // 2. Upload to Free Cloud Storage (ImgBB)
                    const liveImageUrl = await uploadToImgBB(base64Data);
                    
                    // 3. Save the lightweight URL to the state, NOT the heavy base64
                    window.magicalState.images[index] = liveImageUrl;
                    
                    // 4. Update the UI to show the uploaded image
                    if (parentLabel) {
                        parentLabel.style.background = `url(${base64Data}) center/cover no-repeat`;
                        parentLabel.style.border = '2px solid #28a745'; // Green border for success
                        if (plusIcon) plusIcon.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Upload process failed:", error);
                    alert(error.message || "Could not upload this image. Please try again.");
                    if (plusIcon) plusIcon.innerText = "+"; 
                } finally {
                    e.target.value = ''; 
                    parentLabel.style.pointerEvents = "auto"; // Re-enable clicking
                }
            }
        });
    });

    // --- AI GENERATE WISH ---
    const aiBtn = document.getElementById('ai-generate-btn'); 
    const wishTextarea = document.getElementById('main-wish-msg'); 
    if (aiBtn && wishTextarea) {
        aiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            wishTextarea.value = "You turn the most ordinary days into something worth remembering — a random Tuesday feels a little more magical just because you're in it. 💖";
        });
    }

    // --- PREVIEW BUTTON LOGIC ---
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const partnerNameInput = document.getElementById('partner-name-input');
            const partnerName = partnerNameInput ? partnerNameInput.value.trim() : '';

            if (!partnerName) {
                alert("Please enter the name first! ✨");
                return;
            }

            window.magicalState.partnerName = partnerName;
            window.magicalState.userName = document.getElementById('user-name-input')?.value.trim() || "";
            
            // 🚀 NEW: Capture the selected question from the Radio Pills
            const selectedRadio = document.querySelector('input[name="envelope_question"]:checked');
            if (selectedRadio && selectedRadio.value === 'custom') {
                window.magicalState.envelopeQuestion = document.getElementById('envelope-msg')?.value.trim() || "Will you be my forever? 💖";
            } else if (selectedRadio) {
                window.magicalState.envelopeQuestion = selectedRadio.value;
            }

            window.magicalState.mainWish = document.getElementById('main-wish-msg')?.value.trim() || "";
            window.magicalState.audioLink = document.getElementById('audio-link-input')?.value.trim() || "";
            
            window.magicalState.scratchMsgs[1] = document.getElementById('scratch-1')?.value || "Message 1";
            window.magicalState.scratchMsgs[2] = document.getElementById('scratch-2')?.value || "Message 2";
            window.magicalState.scratchMsgs[3] = document.getElementById('scratch-3')?.value || "Message 3";
            window.magicalState.scratchMsgs[4] = document.getElementById('scratch-4')?.value || "Message 4";

            const secretNameEl = document.getElementById('secret-name');
            if (secretNameEl) secretNameEl.innerText = `For ${partnerName} 💖`;
            
                        // 🚀 NEW: Update 3D Envelope text correctly
            const envelopeText = document.getElementById('envelope-letter-text');
            const targetText = window.magicalState.envelopeQuestion || (typeof data !== 'undefined' ? data.envelope_question : null);
            if (envelopeText && targetText) {
                envelopeText.innerHTML = '`;
            }

            
            const finalMsg = document.getElementById('final-message');
            if (finalMsg && window.magicalState.mainWish) {
                finalMsg.innerHTML = window.magicalState.mainWish.replace(/\n/g, '<br>');
            }

            const galleryImgs = document.querySelectorAll('.gallery-img');
            galleryImgs.forEach((img, index) => {
                if (window.magicalState.images[index]) {
                    img.src = window.magicalState.images[index];
                }
            });

            const dummyUser = document.getElementById('dummy-username');
            if (dummyUser) dummyUser.value = partnerName; 

            const orderForm = document.getElementById('order-form-container');
            if (orderForm) orderForm.style.display = "none";

            const previewContainer = document.getElementById('preview-container');
            if (previewContainer) previewContainer.style.display = "block"; 

            showScreen("login-screen");
            window.scrollTo(0, 0);

            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.style.opacity = '0';
                setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600);
            }
        });
    }

    // --- PAY BUTTON & RAZORPAY LOGIC (NO FIREBASE STORAGE NEEDED) ---
    const payBtn = document.getElementById('pay-now-btn');
    if(payBtn) {
        payBtn.addEventListener('click', async function(e){
            e.preventDefault();
            payBtn.innerText = "Securing Magic...";
            payBtn.disabled = true;

            try {
                const configRes = await fetch('https://magical-api.10petalxmagic.workers.dev/api/config');
                const configData = await configRes.json();
                if (!configData.razorpay_key_id) {
                    throw new Error("Razorpay Key ID missing from server configuration.");
                }

                payBtn.innerText = "Initializing Payment...";
                const orderRes = await fetch('https://magical-api.10petalxmagic.workers.dev/api/create-order', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partner_name: window.magicalState.partnerName,
                        user_name: window.magicalState.userName,
                        envelope_question: window.magicalState.envelopeQuestion,
                        main_wish: window.magicalState.mainWish,
                        audio_link: window.magicalState.audioLink,
                        scratch_msgs: window.magicalState.scratchMsgs,
                        images: window.magicalState.images // 🚀 Passing Base64 directly!
                    })
                });
                const order = await orderRes.json();
                if(order.error) throw new Error(order.error);
                // NEW: Save the anonymous stamp in case the customer drops offline!
                localStorage.setItem('magical_recovery_stamp', JSON.stringify({
                    order_id: order.id,
                    gift_id: order.gift_id
                }));
                

                var options = {
                    "key": configData.razorpay_key_id, 
                    "amount": "4900",
                    "currency": "INR",
                    "name": "Magical Surprises",
                    "order_id": order.id,
                    "handler": async function (payment_response) {
                    // Payment finished normally, clear the recovery stamp
                        localStorage.removeItem('magical_recovery_stamp'); 
                        payBtn.innerText = "Verifying Magic..."; 
                        try {
                            const verifyRes = await fetch('https://magical-api.10petalxmagic.workers.dev/api/verify-and-generate-link', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    order_id: payment_response.razorpay_order_id,
                                    payment_id: payment_response.razorpay_payment_id,
                                    signature: payment_response.razorpay_signature,
                                    gift_id: order.gift_id, // Passed from backend!
                                    partner_name: window.magicalState.partnerName,
                                    user_name: window.magicalState.userName,
                                    envelope_question: window.magicalState.envelopeQuestion,
                                    main_wish: window.magicalState.mainWish,
                                    audio_link: window.magicalState.audioLink,
                                    images: window.magicalState.images, 
                                    scratch_msgs: window.magicalState.scratchMsgs
                                })
                            });
                            
                            const result = await verifyRes.json();
                            if(result.status === "success") {
                                const successModal = document.getElementById('success-modal');
                                const linkInput = document.getElementById('generated-link-input');
                                if (successModal && linkInput) {
                                    linkInput.value = result.link;
                                    successModal.style.display = 'flex';
                                }
                                payBtn.innerText = "Link Generated ✔";
                                payBtn.style.background = "#28a745";
                                // 🚀 TRIGGER PHASE 4 & 5: STATE MORPHING
                                activatePostPayState(result.link);
                            } else {
                                throw new Error(result.error);
                            }
                        } catch (verificationError) {
                            console.error("Backend Error:", verificationError);
                            alert("Payment successful, but link generation failed. Contact support with your payment ID.");
                            payBtn.innerText = "Error (See Console)";
                        }
                    },
                    "theme": { "color": "#c0392b" }
                };
                
                var rzp = new Razorpay(options);
                rzp.on('payment.failed', function (response){
                    payBtn.innerText = "Pay Now (₹49)";
                    payBtn.disabled = false;
                });
                rzp.open();
                
            } catch (error) {
                console.error("Payment System Error:", error);
                alert("Error: " + error.message); 
                payBtn.innerText = "Pay Now (₹49)";
                payBtn.disabled = false;
            }
        });
    }
}); // <--- THIS PROPERLY CLOSES THE DOMCONTENTLOADED EVENT LISTENER!

// ==========================================
// 🎩 4. ORIGINAL MAGICAL APP LOGIC
// ==========================================
let typeWriterTriggered = false;

function playPopSound() {
    const pop = document.getElementById("pop-sound");
    if (pop) { pop.currentTime = 0; pop.play().catch(e => {}); }
}

function fireConfetti() {
    if (typeof confetti !== "undefined") {
        var duration = 3000;
        var end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ffb6c1', '#c0392b', '#ffffff', '#ff758c'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ffb6c1', '#c0392b', '#ffffff', '#ff758c'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}
    
function showScreen(screenId) {
    const allScreens = document.querySelectorAll(".screen");
    allScreens.forEach(screen => {
        screen.classList.remove("active");
        screen.style.display = 'none'; 
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        const lazyImages = targetScreen.querySelectorAll('img[data-lazy-src]');
        lazyImages.forEach(img => {
            img.src = img.getAttribute('data-lazy-src'); 
            img.removeAttribute('data-lazy-src'); 
        });

        targetScreen.style.display = 'flex';
        targetScreen.classList.add("active");
    }

    if (screenId === "screen3") fireConfetti();

    if (screenId === "screen4") {
        const envelopeWrapper = document.getElementById("envelope-wrapper");
        const envelopeNextBtn = document.getElementById("envelopeNextBtn");
        const clickHint = document.querySelector(".click-hint");
        if (envelopeWrapper) envelopeWrapper.classList.remove("open");
        if (envelopeNextBtn) envelopeNextBtn.style.display = "none";
        if (clickHint) clickHint.style.display = "block";
    }

    if (screenId === "screen8" && !typeWriterTriggered) {
        triggerTypewriter();
        typeWriterTriggered = true;
    }
}

// Login Screen Physics
const loginScreen = document.getElementById('login-screen');
const tiltCard = document.getElementById('tilt-card');
const unlockBtn = document.getElementById('unlock-btn');
const btnText = unlockBtn?.querySelector('.btn-text');
const btnLoader = unlockBtn?.querySelector('.loader');

if (loginScreen && tiltCard) {
    loginScreen.addEventListener('mousemove', (e) => {
        const rect = tiltCard.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        const tiltX = -(y / 15).toFixed(2);
        const tiltY = (x / 15).toFixed(2);
        tiltCard.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    });

    loginScreen.addEventListener('mouseleave', () => {
        tiltCard.style.transform = `rotateX(0deg) rotateY(0deg)`;
        tiltCard.style.transition = "transform 0.5s ease-out"; 
        setTimeout(() => { tiltCard.style.transition = "transform 0.1s ease-out"; }, 500);
    });
}

if(unlockBtn) {
    unlockBtn.addEventListener('click', () => {
        const user = document.getElementById('dummy-username').value;
        const pass = document.getElementById('dummy-password').value;

        if(user.trim() === '' || pass.trim() === '') {
            tiltCard.classList.add('shake');
            setTimeout(() => tiltCard.classList.remove('shake'), 500);
            return;
        }

        if(btnText && btnLoader) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
        }
        playPopSound(); 

        setTimeout(() => {
            const customAudioLink = window.magicalState?.receiverAudio || window.magicalState?.audioLink;
            const videoId = extractYouTubeId(customAudioLink);

            if (videoId) {
                const iframe = document.createElement('iframe');
                iframe.id = 'magical-yt-iframe'; // 🐛 FIX: Unique ID so Razorpay doesn't intercept it
                // ⚡ MOBILE AUDIO FIX: Strict policies met, hidden visually
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&playsinline=1&enablejsapi=1`;
                iframe.style.position = 'absolute';
                iframe.style.width = '1px';
                iframe.style.height = '1px';
                iframe.style.opacity = '0.01';
                iframe.style.pointerEvents = 'none';
                iframe.style.zIndex = '-9999';
                iframe.allow = 'autoplay; encrypted-media';
                document.body.appendChild(iframe);
            } else {
                const bgMusic = document.getElementById("bg-music");
                if (bgMusic) { 
                    bgMusic.volume = 0.5; 
                    bgMusic.play().catch(e => console.log("Audio play blocked", e)); 
                }
            }
            showScreen("big-penguin-screen");

            setTimeout(() => {
                const giantPeng = document.getElementById('giant-penguin-img');
                if(giantPeng) giantPeng.classList.add('hide-shadow');
                
                setTimeout(() => {
                    showScreen("archery-screen");
                }, 500);
                
            }, 3800); 
            
        }, 1500);
    });
}

// BASIC NAVIGATION
document.getElementById("yesBtn")?.addEventListener("click", () => { playPopSound(); showScreen("screen2"); });
document.getElementById("noBtn")?.addEventListener("click", () => { playPopSound(); showScreen("angry"); });
document.getElementById("tryAgain")?.addEventListener("click", () => { playPopSound(); showScreen("screen1"); });

document.getElementById("screen2")?.addEventListener("click", (e) => {
    if(!e.target.classList.contains("backBtn")) { playPopSound(); showScreen("screen3"); }
});

const nextMap = {
    "#screen3 .heartNext": "screen4", "#screen5 .heartNext": "screen6",
    "#screen6 .heartNext": "screen7", "#screen7 .heartNext": "screen8"
};

Object.keys(nextMap).forEach(selector => {
    document.querySelector(selector)?.addEventListener("click", () => { playPopSound(); showScreen(nextMap[selector]); });
});

document.querySelectorAll(".backBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation(); playPopSound(); showScreen(btn.getAttribute("data-back"));
    });
});
// ==========================================
// 🏃‍♂️ PHASE 3: EVASION PHYSICS & REACTION ENGINE
// ==========================================
const evasionArena = document.getElementById("evasion-arena");
const envelopeYesBtn = document.getElementById("envelopeYesBtn");
const envelopeNoBtn = document.getElementById("envelopeNoBtn");
const evasionToast = document.getElementById("evasion-toast");
const evasionToastText = document.getElementById("evasion-toast-text");
const envelopeReactionGif = document.getElementById("envelope-reaction-gif");
const screen4Title = document.getElementById("screen4-title");
const envelopeNextBtn = document.getElementById("envelopeNextBtn");

// Playful Dialogues exactly from the video!
const evasionMessages = [
    "Try again... it's not gonna bite 😅",
    "Bro the No button is literally scared of you 😂",
    "Okay but what if you just... said yes? 👀",
    "NO?? In this economy?? 😱",
    "The audacity... but okay... try again bestie 💅",
    "Sir/Ma'am this is a yes-only zone 🚫",
    "Error 404: No button not found 😂",
    "That's so funny haha. Now say yes. 🫠",
    "The No button files a restraining order 🏃‍♂️",
    "Come on, just say yes na 🥺"
];
let dodgeCount = 0;

// 1. Reveal Arena when Envelope Opens
const envelopeWrapperPhase3 = document.getElementById("envelope-wrapper");
if (envelopeWrapperPhase3) {
    envelopeWrapperPhase3.addEventListener("click", () => {
        if (!envelopeWrapperPhase3.classList.contains("open")) { 
            playPopSound(); 
            // 🛑 NO CONFETTI YET! Wait for them to click YES.
        }
        envelopeWrapperPhase3.classList.add("open");
        const clickHint = document.querySelector(".click-hint");
        if (clickHint) clickHint.style.display = "none"; 
        
        // Show Arena, Toast, and Teasing Penguin after envelope opens
        setTimeout(() => {
            if (evasionArena) evasionArena.style.display = "flex";
            if (evasionToast) evasionToast.style.display = "block";
            if (envelopeReactionGif) envelopeReactionGif.src = "penguinTT3.gif"; // Teasing penguin
        }, 1000);
    });
}

// 2. High-Performance Dodge Physics
function dodgeButton() {
    if (!envelopeNoBtn || !evasionArena) return;
    
    const arenaRect = evasionArena.getBoundingClientRect();
    const btnRect = envelopeNoBtn.getBoundingClientRect();
    
    // Calculate safe boundaries so it doesn't fly off the screen
    const maxX = arenaRect.width - btnRect.width;
    const maxY = 180; // Vertical roaming space
    
    // Randomize coordinates within bounds
    const randomX = Math.random() * maxX;
    const randomY = (Math.random() * maxY) - (maxY / 2); 
    
    // Apply zero-lag GPU-accelerated transform
    envelopeNoBtn.style.transform = `translate(${randomX - (maxX/2)}px, ${randomY}px)`;
    
    // Update Toast text based on array
    if (evasionToastText) {
        evasionToastText.innerText = evasionMessages[dodgeCount % evasionMessages.length];
    }
    
    // Trigger quick CSS Glitch animation
    envelopeNoBtn.classList.remove("blink-glitch");
    void envelopeNoBtn.offsetWidth; // Trigger reflow instantly
    envelopeNoBtn.classList.add("blink-glitch");
    
    dodgeCount++;
    playPopSound();
}

// Bind Dodge Events (Hover for Desktop, Touch for Mobile)
if (envelopeNoBtn) {
    envelopeNoBtn.addEventListener("mouseover", dodgeButton);
    envelopeNoBtn.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Force stop the click from registering
        dodgeButton();
    }, {passive: false});
}

// 3. The YES Button Victory! 🎉
if (envelopeYesBtn) {
    envelopeYesBtn.addEventListener("click", () => {
        playPopSound();
        fireConfetti();
        
        // Hide Evasion Elements
        if (envelopeNoBtn) envelopeNoBtn.style.display = "none";
        if (evasionToast) evasionToast.style.display = "none";
        
        // Update Title & Show Celebration GIF
        if (screen4Title) screen4Title.innerText = "Yay! I knew you'd say YES! ❤️";
        if (envelopeReactionGif) envelopeReactionGif.src = "PenguinTT2.gif";
        
        // Bonus: Update the side penguin
        const sidePenguin = document.querySelector(".side-penguin");
        if (sidePenguin) sidePenguin.src = "penguinTT4.gif";
        
        // Reveal Next Button
        if (envelopeNextBtn) {
            envelopeNextBtn.style.display = "inline-block";
        }
    });
}

if (envelopeNextBtn) {
    envelopeNextBtn.addEventListener("click", () => { playPopSound(); showScreen("screen5"); });
}
// BACKGROUND PARTICLES
const pCanvas = document.getElementById("particle-canvas");
if (pCanvas) {
    const pCtx = pCanvas.getContext("2d");
    let particles = [];
    const emojis = ["🌸", "💖", "✨", "🌸", "🤍"];

    function resizeCanvas() { pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Particle {
        constructor() { this.reset(); this.y = Math.random() * pCanvas.height; }
        reset() {
            this.x = Math.random() * pCanvas.width; this.y = -50; this.size = Math.random() * 15 + 15;
            this.speed = Math.random() * 2 + 1.5; this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
            this.rotation = Math.random() * 360; this.rotationSpeed = (Math.random() - 0.5) * 2;
        }
        update() {
            this.y += this.speed; this.rotation += this.rotationSpeed;
            if (this.y > pCanvas.height + 50) this.reset();
        }
        draw() {
            pCtx.save(); pCtx.translate(this.x, this.y); pCtx.rotate(this.rotation * Math.PI / 180);
            pCtx.font = `${this.size}px Arial`; pCtx.textAlign = "center"; pCtx.textBaseline = "middle";
            pCtx.globalAlpha = 0.6; pCtx.fillText(this.emoji, 0, 0); pCtx.restore();
        }
    }

    for (let i = 0; i < 30; i++) particles.push(new Particle());
    function animateParticles() {
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}

// TYPEWRITER
function triggerTypewriter() {
    const pElement = document.getElementById("final-message");
    if (!pElement) return;
    const text = pElement.innerHTML.replace(/<br\s*\/?>/gi, '\n').trim(); 
    pElement.innerHTML = "";
    let i = 0;
    function typing() {
        if (i < text.length) {
            let char = text.charAt(i);
            pElement.innerHTML += (char === '\n') ? "<br>" : char;
            i++;
            setTimeout(typing, 35);
        } else {
            const secretName = document.getElementById("secret-name");
            if (secretName) secretName.classList.add("show-name");
        }
    }
    typing();
}

// CUSTOM SCRATCH CARDS
const modal = document.getElementById('scratch-modal');
const modalContent = document.getElementById('modal-message-content');
const scratchCanvas = document.getElementById('popup-scratch-pad');
const scratchSound = document.getElementById('scratch-sound');

document.querySelectorAll('.mini-card').forEach(card => {
    card.addEventListener('click', () => {
        playPopSound();
        const cardId = card.getAttribute('data-id');
        const customMsg = window.magicalState.scratchMsgs[cardId] || "A special message for you!";
        
        if(modalContent) {
            modalContent.innerHTML = `<span style="font-size: 1.3rem; font-weight: bold; color: var(--primary-color); font-family: 'Fredoka', sans-serif; line-height: 1.4; display: block; padding: 10px;">${customMsg.replace(/\n/g, '<br>')}</span>`;
        }

        if(modal) modal.classList.add('show');
        setTimeout(initPopupScratchCard, 300);
    });
});

document.getElementById('close-modal')?.addEventListener('click', () => { 
    playPopSound(); 
    if(modal) modal.classList.remove('show'); 
});

let isDrawing = false; 
let lastAudioTime = 0; 
let scratchEventsBound = false; 

function initPopupScratchCard() {
    if(!scratchCanvas) return;
    const ctx = scratchCanvas.getContext('2d');
    const rect = scratchCanvas.parentElement.getBoundingClientRect();
    scratchCanvas.width = rect.width; 
    scratchCanvas.height = rect.height;

    ctx.globalCompositeOperation = 'source-over'; 
    ctx.fillStyle = '#b3b3b3'; 
    ctx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
    
    ctx.font = "bold 24px 'Fredoka', sans-serif"; 
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle";
    ctx.fillText("Scratch Me! ✨", scratchCanvas.width / 2, scratchCanvas.height / 2);

    if (!scratchEventsBound) {
        function scratch(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const dynamicCtx = scratchCanvas.getContext('2d');
            const canvasRect = scratchCanvas.getBoundingClientRect();
            let x = (e.touches ? e.touches[0].clientX : e.clientX) - canvasRect.left;
            let y = (e.touches ? e.touches[0].clientY : e.clientY) - canvasRect.top;

            dynamicCtx.globalCompositeOperation = 'destination-out';
            dynamicCtx.beginPath(); 
            dynamicCtx.arc(x, y, 25, 0, Math.PI * 2); 
            dynamicCtx.fill();

            const now = Date.now();
            if (now - lastAudioTime > 150) { 
                if (scratchSound) { scratchSound.currentTime = 0; scratchSound.play().catch(e => {}); }
                lastAudioTime = now;
            }
        }

        scratchCanvas.addEventListener('mousedown', () => isDrawing = true);
        scratchCanvas.addEventListener('mouseup', () => isDrawing = false);
        scratchCanvas.addEventListener('mousemove', scratch);
        scratchCanvas.addEventListener('touchstart', (e) => { isDrawing = true; scratch(e); }, {passive: false});
        scratchCanvas.addEventListener('touchend', () => isDrawing = false);
        scratchCanvas.addEventListener('touchmove', scratch, {passive: false});
        scratchEventsBound = true; 
    }
}

// PARALLAX OPTIMIZATION
let targetX = 0, targetY = 0; 
let currentX = 0, currentY = 0;

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

window.addEventListener("deviceorientation", throttle((e) => {
    if (!e.gamma || !e.beta) return;
    let tiltX = e.gamma; 
    let tiltY = e.beta;  
    if (tiltX > 25) tiltX = 25; 
    if (tiltX < -25) tiltX = -25;
    if (tiltY > 55) tiltY = 55; 
    if (tiltY < 25) tiltY = 25; 
    targetX = (tiltX / 25) * 15; 
    targetY = ((tiltY - 40) / 15) * 15; 
}, 20));

document.addEventListener("mousemove", throttle((e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30; 
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    targetX = x; targetY = y;
}, 20));

function renderParallax() {
    currentX += (targetX - currentX) * 0.1; 
    currentY += (targetY - currentY) * 0.1;
    document.querySelectorAll(".character, .glass, .envelope-wrapper, .cake, .flowers").forEach(el => {
        const depth = el.classList.contains('glass') ? 0.4 : 1;
        el.style.transform = `translate(${currentX * depth}px, ${currentY * depth}px)`;
    });
    requestAnimationFrame(renderParallax);
}
renderParallax(); 
// INSTAGRAM DOUBLE TAP & LIGHTBOX
const photoModal = document.getElementById('photo-modal');
const modalImage = document.getElementById('modal-image');
const closePhotoModalBtn = document.getElementById('close-photo-modal');

document.querySelectorAll('.ig-card').forEach(card => {
    let lastTap = 0;
    let tapTimer;

    card.addEventListener('click', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        
        if (tapLength < 300 && tapLength > 0) {
            clearTimeout(tapTimer); 
            e.preventDefault();
            if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]); 
            const heart = document.createElement('div');
            heart.classList.add('popup-heart');
            heart.innerText = '❤️';
            card.appendChild(heart);
            setTimeout(() => heart.remove(), 1000);
        } else {
            tapTimer = setTimeout(() => {
                playPopSound();
                const img = card.querySelector('.gallery-img');
                if(img && modalImage && photoModal) {
                    modalImage.src = img.src;
                    photoModal.classList.add('show');
                    // 🐛 FIX: Hide Mute Button when Photo Modal Opens
                    const muteBtn = document.getElementById('mute-toggle-btn');
                    if (muteBtn) muteBtn.style.display = 'none';
                }
            }, 300); 
        }
        lastTap = currentTime;
    });
});

if(closePhotoModalBtn) {
    closePhotoModalBtn.addEventListener('click', () => {
        playPopSound();
        if(photoModal) photoModal.classList.remove('show');
        //🐛 FIX: Restore Mute Button when Photo Modal Closes
        const muteBtn = document.getElementById('mute-toggle-btn');
            if (muteBtn) muteBtn.style.display = 'flex';
    });
}

// NEW ARCHERY "TAP ANYWHERE" LOGIC
const archeryScreen = document.getElementById('archery-screen');
const theBow = document.getElementById('the-bow');
const theHeart = document.getElementById('the-heart');
let hasShot = false;

if (archeryScreen) {
    archeryScreen.addEventListener('click', () => {
        if (hasShot) return; 
        hasShot = true;

        const tapText = archeryScreen.querySelector('.swipe');
        if(tapText) tapText.style.opacity = '0';

        theBow.classList.add('fly');

        setTimeout(() => {
            theBow.classList.add('hidden');
            theHeart.classList.add('burst');
            fireConfetti();
            playPopSound();

            setTimeout(() => {
                showScreen('screen1');
            }, 4200);

        }, 350); 
    });
}
// ==========================================
// 🔮 5. RECEIVER PAYLOAD HYDRATION (STRICT MODE)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const giftId = urlParams.get('gift');
    
    const preloader = document.getElementById('preloader');
    const orderForm = document.getElementById('order-form-container');
    const previewContainer = document.getElementById('preview-container');
    const loginScreen = document.getElementById('login-screen');
    const payBtn = document.getElementById('pay-now-btn');
    
    if (giftId) {
        if (orderForm) orderForm.remove(); 
        if (payBtn) payBtn.remove();
        
        if (preloader) { preloader.style.opacity = '1'; preloader.style.visibility = 'visible'; }
        
        try {
            const response = await fetch(`https://magical-api.10petalxmagic.workers.dev/api/get-gift/${giftId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                const data = result.data;
                const secretNameEl = document.getElementById('secret-name');
                if (secretNameEl) secretNameEl.innerText = `For ${data.partner_name} 💖`;
                
                const dummyUser = document.getElementById('dummy-username');
                if (dummyUser) dummyUser.value = data.partner_name;
                
                            // 🚀 NEW: Update 3D Envelope text correctl
                const envelopeText = document.getElementById('envelope-letter-text');
                const targetText = window.magicalState.envelopeQuestion || (typeof data !== 'undefined' ? data.envelope_question : null);
                if (envelopeText && targetText) {
                    envelopeText.innerHTML = ``;
                }
            

                const finalMsg = document.getElementById('final-message');
                if (finalMsg && data.main_wish) finalMsg.innerHTML = data.main_wish.replace(/\n/g, '<br>'); 
                
                if (data.images) {
                    const galleryImgs = document.querySelectorAll('.gallery-img');
                    galleryImgs.forEach((img, index) => {
                        const imgUrl = data.images[index] || data.images[index.toString()];
                        if (imgUrl) {
                            img.setAttribute('data-lazy-src', imgUrl);
                        }
                    });
                }
                
                if (data.scratch_msgs) {
                    window.magicalState.scratchMsgs = data.scratch_msgs;
                }
                
                if (data.audio_link) { window.magicalState = window.magicalState || {}; window.magicalState.receiverAudio = data.audio_link; }
                
                if (previewContainer) previewContainer.style.display = 'block';
                if (loginScreen) { loginScreen.style.display = 'flex'; loginScreen.classList.add('active'); }
            } else {
                // 🛑 NEW HARD STOP: Wipe the screen if link is broken
                document.body.innerHTML = `
                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #ffe6ea; font-family: sans-serif; text-align: center; padding: 20px;">
                        <h1 style="color: #c0392b; font-size: 3rem; margin-bottom: 10px;">Oops! 🥀</h1>
                        <p style="color: #5d4037; font-size: 1.2rem;">This magical link is broken, expired, or the payment was not completed.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Failed to load gift data:", error);
            // 🛑 NEW HARD STOP FOR NETWORK ERRORS
            document.body.innerHTML = `
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: #ffe6ea; font-family: sans-serif; text-align: center; padding: 20px;">
                    <h1 style="color: #c0392b; font-size: 3rem; margin-bottom: 10px;">Connection Error 🔌</h1>
                    <p style="color: #5d4037; font-size: 1.2rem;">We couldn't connect to the magic servers. Please refresh the page.</p>
                </div>
            `;
        } finally {
            if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600); }
        }
    } else {
        if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600); }
    }
        // --- 🚀 NEW: ANONYMOUS RECOVERY SCANNER ---
    const recoveryStamp = localStorage.getItem('magical_recovery_stamp');
    if (recoveryStamp && !window.location.search.includes('gift=')) {
        try {
            const parsedStamp = JSON.parse(recoveryStamp);
            const recoverRes = await fetch('https://magical-api.10petalxmagic.workers.dev/api/recover-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedStamp)
            });
            const recoverData = await recoverRes.json();
            
            if (recoverData.status === 'success') {
                // The Webhook saved the day!
                localStorage.removeItem('magical_recovery_stamp');
                
                // Show the success modal directly
                const successModal = document.getElementById('success-modal');
                const linkInput = document.getElementById('generated-link-input');
                if (successModal && linkInput) {
                    linkInput.value = recoverData.link;
                    successModal.style.display = 'flex';
                }
                
                // Instantly activate the post-pay copy buttons
                if (typeof activatePostPayState === 'function') {
                    activatePostPayState(recoverData.link);
                }
            }
        } catch (e) {
            console.error("Recovery ping failed", e);
        }
    }
    
});
// ==========================================
// 🎵 PHASE 2: GLOBAL MUTE / UNMUTE LOGIC (BUG-FREE)
// ==========================================
let isSystemMuted = false;

document.addEventListener('click', (e) => {
    const muteBtn = e.target.closest('#mute-toggle-btn');
    if (muteBtn) {
        e.preventDefault();
        e.stopPropagation(); 
        
        isSystemMuted = !isSystemMuted;
        muteBtn.innerText = isSystemMuted ? "🔇" : "🎶";

        // 1. Mute HTML5 Background Music & SFX
        const bgMusic = document.getElementById("bg-music");
        if (bgMusic) {
            bgMusic.muted = isSystemMuted;
            bgMusic.volume = isSystemMuted ? 0 : 0.5; // Double fallback
        }
        
        const popSound = document.getElementById("pop-sound");
        if (popSound) popSound.muted = isSystemMuted;
        
        const scratchSound = document.getElementById("scratch-sound");
        if (scratchSound) scratchSound.muted = isSystemMuted;

        // 2. Mute YouTube Iframe Safely (Bypassing Razorpay)
        const ytIframe = document.getElementById('magical-yt-iframe');
        if (ytIframe && ytIframe.contentWindow) {
            const command = isSystemMuted ? 'mute' : 'unMute';
            // Explicit string format required by YouTube API on mobile
            ytIframe.contentWindow.postMessage(`{"event":"command","func":"${command}","args":""}`, '*');
        }
    }
});

// 🚀 SHOW BUTTON WHEN MAGIC UNLOCKS
const originalShowScreen = showScreen;
window.showScreen = function(screenId) {
    originalShowScreen(screenId);
    const muteToggleBtn = document.getElementById('mute-toggle-btn');
    if (screenId === "big-penguin-screen" && muteToggleBtn) {
        muteToggleBtn.style.display = "flex";
    }
};
// ==========================================
// 📋 PHASE 3: CLIPBOARD COPY LOGIC
// ==========================================
const copyLinkBtn = document.getElementById('copy-link-btn');
if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
        const linkInput = document.getElementById('generated-link-input');
        
        // Select text safely for mobile browsers
        linkInput.select();
        linkInput.setSelectionRange(0, 99999);
        
        navigator.clipboard.writeText(linkInput.value).then(() => {
            copyLinkBtn.innerText = "COPIED! ✔";
            copyLinkBtn.style.background = "#218838";
            
            // Reset button text after 2 seconds
            setTimeout(() => {
                copyLinkBtn.innerText = "COPY 📋";
                copyLinkBtn.style.background = "#28a745";
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert("Could not copy automatically. Please copy the link manually.");
        });
    });
}

const closeSuccessBtn = document.getElementById('close-success-btn');
if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', () => {
        document.getElementById('success-modal').style.display = 'none';
    });
}
// ==========================================
// ⏳ PHASE 4 & 5: STATE MORPHING & 5-MIN TIMER
// ==========================================
function activatePostPayState(link) {
    const payBtn = document.getElementById('pay-now-btn');
    const postPayBtn = document.getElementById('post-pay-copy-btn');
    
    if (payBtn && postPayBtn) {
        // 1. Swap the buttons to prevent Razorpay Ghost Clicks
        payBtn.style.display = 'none'; 
        postPayBtn.style.display = 'block'; 
        
        // 2. Secure Copy Logic
        postPayBtn.onclick = () => {
            navigator.clipboard.writeText(link).then(() => {
                const originalText = postPayBtn.innerHTML;
                postPayBtn.innerHTML = '<span class="btn-text">COPIED! ✔</span>';
                postPayBtn.style.background = "#28a745"; // Flash green
                
                setTimeout(() => { 
                    postPayBtn.innerHTML = originalText; 
                    postPayBtn.style.background = "linear-gradient(to right, #17a2b8, #138496)"; // Return to blue
                }, 2000);
            }).catch(() => {
                // Fallback: If mobile browser blocks clipboard, re-open the Phase 3 Popup!
                const modal = document.getElementById('success-modal');
                if(modal) modal.style.display = 'flex';
            });
        };

        // 3. The 5-Minute Self-Destruct Timer (300 seconds)
        let timeLeft = 300; 
        const timerInterval = setInterval(() => {
            timeLeft--;
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            
            // Only update text if it doesn't currently say "COPIED! ✔"
            if (!postPayBtn.innerText.includes("COPIED")) {
                postPayBtn.innerHTML = `<span class="btn-text">COPY LINK 📋 (${minutes}:${seconds < 10 ? '0' : ''}${seconds})</span>`;
            }
            
            // 4. Session Expiration
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                postPayBtn.disabled = true;
                postPayBtn.style.background = "#6c757d"; // Gray out
                postPayBtn.innerHTML = '<span class="btn-text">SESSION EXPIRED 🔒</span>';
                postPayBtn.onclick = null; // Remove click ability completely
            }
        }, 1000);
    }
}
// ==========================================
// 🚀 PHASE 2: MEMORY MAGIC BUTTON & MODAL LOGIC
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Check if the user is the receiver (has a ?gift= ID in the URL)
    const urlParams = new URLSearchParams(window.location.search);
    const giftId = urlParams.get('gift');
    
    const memoryMagicBtn = document.getElementById('memory-magic-btn');
    const magicModal = document.getElementById('magic-story-modal');
    const closeMagicBtn = document.getElementById('close-magic-modal');

    // 2. Only reveal the button if it's the receiver viewing the gift
    if (giftId && memoryMagicBtn) {
        memoryMagicBtn.style.display = 'block';
    }

    // 3. Open the Modal when the Magic Button is clicked
    if (memoryMagicBtn && magicModal) {
        memoryMagicBtn.addEventListener('click', () => {
            magicModal.style.display = 'flex'; // Show the Instagram popup
            
            // Safely trigger the heavy lifting in the background
            generateMagicStoryImage();
        });
    }

    // 4. Safely Close the Modal
    if (closeMagicBtn && magicModal) {
        closeMagicBtn.addEventListener('click', () => {
            magicModal.style.display = 'none';
        });
    }
});
// 🚀 PHASE 3: LIGHTWEIGHT QR CODE PRE-LOADING
// 1. We create a global variable so the Canvas in Phase 4/5 can access it instantly
window.magicQRCode = new Image();

// 2. CRITICAL FIX: We must allow Cross-Origin (CORS) or the Canvas will crash when trying to export!
window.magicQRCode.crossOrigin = "Anonymous"; 

// 3. We use a lightning-fast, library-free cloud API to generate the QR image.
// Pointing exactly to your marketing strategy link: 10petalx.vercel.app
window.magicQRCode.src = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://10petalx.vercel.app&margin=1";

// 4. Silent Error Handling: If the network drops, it won't crash the site.
window.magicQRCode.onerror = () => {
    console.warn("⚠️ QR Code failed to preload, but the site will not crash.");
};
// ==========================================
// 🚀 THE ULTIMATE INSTA-VIBE STORY ENGINE (BUG-FREE & LAG-FREE)
// ==========================================
async function generateMagicStoryImage() {
    const loadingText = document.getElementById('magic-loading-text');
    const finalImg = document.getElementById('final-magic-img');
    const downloadBtn = document.getElementById('download-magic-btn');
    
    if (loadingText) {
        loadingText.style.display = 'block';
        loadingText.innerText = "Crafting Your Story... ✨";
    }
    if (finalImg) finalImg.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';

    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Exact 9:16 Instagram Story Canvas Ratio
        const CANVAS_WIDTH = 1080;
        const CANVAS_HEIGHT = 1920;
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        
        // 1. ROMANTIC BIRTHDAY BACKGROUND
        const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#fff0f5'); 
        gradient.addColorStop(1, '#ffe4e1'); 
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Subtle floating birthday emojis in the background
        ctx.globalAlpha = 0.4; 
        ctx.font = "60px sans-serif";
        ctx.fillText("✨", 150, 200);
        ctx.fillText("💖", 900, 300);
        ctx.fillText("🎂", 200, 1750);
        ctx.fillText("✨", 850, 1600);
        ctx.globalAlpha = 1.0;

        // 2. FAILSAFE IMAGE LOADER
        const loadCanvasImage = (sourceUrl) => {
            return new Promise((resolve) => {
                if (!sourceUrl || sourceUrl.includes('data:image/svg+xml') || sourceUrl.includes('R0lGODlh')) {
                    resolve(null); return;
                }
                const img = new Image();
                img.crossOrigin = "Anonymous"; 
                img.onload = () => resolve(img);
                img.onerror = () => resolve(null);
                img.src = sourceUrl;
            });
        };

        const galleryElements = document.querySelectorAll('.gallery-img');
        const sourceUrls = [
            window.magicalState.images[0] || galleryElements[0]?.getAttribute('data-lazy-src') || galleryElements[0]?.src,
            window.magicalState.images[1] || galleryElements[1]?.getAttribute('data-lazy-src') || galleryElements[1]?.src,
            window.magicalState.images[2] || galleryElements[2]?.getAttribute('data-lazy-src') || galleryElements[2]?.src,
            window.magicalState.images[3] || galleryElements[3]?.getAttribute('data-lazy-src') || galleryElements[3]?.src
        ];

        const loadedImages = await Promise.all(sourceUrls.map(loadCanvasImage));

        // 3. THE WHITE INSTAGRAM POST CARD SETUP
        const gridPadding = 80;
        const cellSize = 440; 
        const gap = 40;
        const startX = gridPadding + 10;
        const startY = 320; // Pushed down to make room for Insta Header

        // Calculate exact White Card dimensions
        const cardWidth = (cellSize * 2) + gap + 60;
        const cardHeight = (cellSize * 2) + gap + 340; // Fits Header, Grid, Icons, and Text
        const cardX = (CANVAS_WIDTH - cardWidth) / 2;
        const cardY = startY - 120; // Card starts higher up for header

        // Draw White Card
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(192, 57, 43, 0.12)';
        ctx.shadowBlur = 50;
        ctx.shadowOffsetY = 15;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 35);
        ctx.fill();
        ctx.shadowColor = 'transparent'; 

        // 4. FANTASTIC INSTAGRAM TOUCH: THE NATIVE UI
        const partnerName = window.magicalState.partnerName || "Someone Special";
        
        // --- Insta Header ---
        // Gradient Profile Ring
        const igGrad = ctx.createLinearGradient(cardX + 30, cardY + 30, cardX + 100, cardY + 100);
        igGrad.addColorStop(0, '#f09433'); igGrad.addColorStop(0.3, '#dc2743'); igGrad.addColorStop(1, '#bc1888');
        ctx.strokeStyle = igGrad;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cardX + 65, cardY + 60, 26, 0, Math.PI * 2);
        ctx.stroke();
        
        // Grey Profile Pic inside Ring
        ctx.fillStyle = '#efefef';
        ctx.beginPath();
        ctx.arc(cardX + 65, cardY + 60, 20, 0, Math.PI * 2);
        ctx.fill();

        // Username & Menu Dots
        ctx.font = "bold 32px 'Segoe UI', Roboto, sans-serif";
        ctx.fillStyle = "#262626";
        ctx.textAlign = "left";
        ctx.fillText(partnerName.toLowerCase() + "_memories", cardX + 110, cardY + 70);
        ctx.font = "bold 40px 'Segoe UI', Roboto, sans-serif";
        ctx.fillText("⋮", cardX + cardWidth - 50, cardY + 70);

        // 5. DRAW THE PHOTOS (2x2 Grid)
        const positions = [
            { x: cardX + 30, y: startY },
            { x: cardX + 30 + cellSize + gap, y: startY },
            { x: cardX + 30, y: startY + cellSize + gap },
            { x: cardX + 30 + cellSize + gap, y: startY + cellSize + gap }
        ];

        loadedImages.forEach((img, index) => {
            const posX = positions[index].x;
            const posY = positions[index].y;
            if (img) {
                const scale = Math.max(cellSize / img.width, cellSize / img.height);
                const drawW = img.width * scale;
                const drawH = img.height * scale;
                const offsetX = posX + (cellSize - drawW) / 2;
                const offsetY = posY + (cellSize - drawH) / 2;

                ctx.save();
                ctx.beginPath();
                ctx.roundRect(posX, posY, cellSize, cellSize, 16); // Slightly rounded inner photos
                ctx.clip();
                ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
                ctx.restore();
            } else {
                ctx.fillStyle = '#fce4ec';
                ctx.beginPath();
                ctx.roundRect(posX, posY, cellSize, cellSize, 16);
                ctx.fill();
            }
        });

        // --- Insta Footer (Action Buttons & Greeting) ---
        const footerY = startY + (cellSize * 2) + gap + 60;
        
        // Action Icons (Heart, Chat, Share)
        ctx.font = "45px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("❤️  💬  ⌲", cardX + 30, footerY);
        
        // Bookmark Icon on right
        ctx.textAlign = "right";
        ctx.fillText("🔖", cardX + cardWidth - 30, footerY);

        // Greeting Text inside Card
        ctx.textAlign = "center";
        ctx.fillStyle = "#880e4f";
        ctx.font = "700 85px 'Caveat', cursive";
        ctx.fillText(`For ${partnerName} 💖`, CANVAS_WIDTH / 2, footerY + 110);

        // ==========================================
        // 🎯 6. MARKETING PLACEMENT (Directly BELOW the white card)
        // ==========================================
        const marketingStartY = cardY + cardHeight + 40; // Starts right under the card

        // Draw QR Code
        const qrSize = 130; 
        const qrX = (CANVAS_WIDTH / 2) - (qrSize / 2);
        
        if (window.magicQRCode && window.magicQRCode.complete && window.magicQRCode.naturalWidth !== 0) {
            // Cute white background behind QR
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(qrX - 10, marketingStartY, qrSize + 20, qrSize + 20, 15);
            ctx.fill();
            ctx.drawImage(window.magicQRCode, qrX, marketingStartY + 10, qrSize, qrSize);
        }

        // Links and Text below QR
        ctx.font = "bold 32px 'Fredoka', sans-serif";
        ctx.fillStyle = "#c0392b";
        ctx.fillText("10petalx.vercel.app", CANVAS_WIDTH / 2, marketingStartY + qrSize + 60);

        ctx.font = "500 24px 'Fredoka', sans-serif";
        ctx.fillStyle = "rgba(136, 14, 79, 0.7)";
        ctx.fillText("Create your own surprise ✨", CANVAS_WIDTH / 2, marketingStartY + qrSize + 95);

        // ==========================================
        // 📥 7. EXPORT ENGINE (Zero Lag)
        // ==========================================
        const finalDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        if (loadingText) loadingText.style.display = 'none';
        if (finalImg) {
            finalImg.src = finalDataUrl;
            finalImg.style.display = 'block';
        }

        if (downloadBtn) {
            downloadBtn.style.display = 'block';
            const newDownloadBtn = downloadBtn.cloneNode(true);
            downloadBtn.parentNode.replaceChild(newDownloadBtn, downloadBtn);

            newDownloadBtn.addEventListener('click', () => {
                const link = document.createElement('a');
                link.download = `Memories_For_${partnerName}.jpg`;
                link.href = finalDataUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                newDownloadBtn.innerHTML = '<span class="btn-text">Saved to Gallery! 💖</span>';
                setTimeout(() => {
                    newDownloadBtn.innerHTML = '<span class="btn-text">📥 Download for Insta Story</span>';
                }, 2500);
            });
        }

    } catch (error) {
        console.error("Story Engine Error:", error);
        if (loadingText) loadingText.innerText = "Could not render story image. Please try again.";
    }
}
