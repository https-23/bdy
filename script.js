// ==========================================
// 🧠 0. GLOBAL STATE & COMPRESSION ENGINE
// ==========================================
window.magicalState = {
    partnerName: "",
    userName: "",
    envelopeMsg: "",
    mainWish: "",
    audioLink: "",
    images: { 0: null, 1: null, 2: null, 3: null },
    scratchMsgs: { 1: "", 2: "", 3: "", 4: "" } // NEW: Stores custom scratch texts
};

async function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                
                // PHASE 4 FIX: Dropped max dimensions from 800 to 600.
                // This slashes the memory weight of the site, preventing it from freezing.
                const MAX_WIDTH = 600;
                const MAX_HEIGHT = 600;
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
                
                // PHASE 4 FIX: Quality dropped from 0.55 to 0.4.
                // Looks identical on mobile screens but drastically speeds up the backend upload.
                resolve(canvas.toDataURL('image/webp', 0.4));
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
// 📸 1. PHOTO UPLOAD & AUTO-WISH
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // 🚀 1. THE NEW BULLETPROOF CLICK TRIGGER
    const photoBoxes = document.querySelectorAll('.photo-upload-box');
    photoBoxes.forEach((box) => {
        box.addEventListener('click', (e) => {
            // Stop if they somehow managed to click the input directly
            if (e.target.tagName.toLowerCase() === 'input') return;
            
            const fileInput = box.querySelector('input[type="file"]');
            if (fileInput) {
                fileInput.value = null; // Clear the cache so it works every time
                fileInput.click();      // FORCES the phone gallery to open!
            }
        });
    });

    // 📸 2. YOUR EXISTING FILE PROCESSOR
    const photoInputs = document.querySelectorAll('.photo-upload-box input[type="file"]');
    photoInputs.forEach((input, index) => {
        input.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64Data = await compressImage(file);
                    window.magicalState.images[index] = base64Data;
                    
                    // Use closest() since we switched to <div> tags earlier
                    const parentBox = input.closest('.photo-upload-box');
                    if (parentBox) {
                        parentBox.style.backgroundImage = `url('${base64Data}')`;
                        parentBox.style.backgroundSize = 'cover';
                        parentBox.style.backgroundPosition = 'center';
                        parentBox.style.border = 'none';
                        const plusIcon = parentBox.querySelector('.upload-icon');
                        if (plusIcon) plusIcon.style.display = 'none';
                        const textHint = parentBox.querySelector('.upload-text');
                        if (textHint) textHint.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Compression failed:", error);
                    alert("Could not process this image. Please try a different one.");
                }
            }
        });
    });

    // ... The rest of your code (aiBtn logic, etc.) stays exactly the same below here!


    const aiBtn = document.getElementById('ai-generate-btn'); 
    const wishTextarea = document.getElementById('main-wish-msg'); 
    if (aiBtn && wishTextarea) {
        aiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            wishTextarea.value = "You turn the most ordinary days into something worth remembering — a random Tuesday feels a little more magical just because you're in it. 💖";
        });
    }

    // ==========================================
    // 🚀 2. PREVIEW BUTTON & STATE CAPTURE
    // ==========================================
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const partnerNameInput = document.getElementById('partner-name-input');
            const partnerName = partnerNameInput ? partnerNameInput.value.trim() : '';

            if (!partnerName) {
                alert("Please enter the name first! ✨");
                return;
            }

            // Capture all form inputs
            window.magicalState.partnerName = partnerName;
            window.magicalState.userName = document.getElementById('user-name-input')?.value.trim() || "";
            window.magicalState.envelopeMsg = document.getElementById('envelope-msg')?.value.trim() || "";
            window.magicalState.mainWish = document.getElementById('main-wish-msg')?.value.trim() || "";
            window.magicalState.audioLink = document.getElementById('audio-link-input')?.value.trim() || "";
            
            // Capture custom Scratch Messages
            window.magicalState.scratchMsgs[1] = document.getElementById('scratch-1')?.value || "Message 1";
            window.magicalState.scratchMsgs[2] = document.getElementById('scratch-2')?.value || "Message 2";
            window.magicalState.scratchMsgs[3] = document.getElementById('scratch-3')?.value || "Message 3";
            window.magicalState.scratchMsgs[4] = document.getElementById('scratch-4')?.value || "Message 4";

            const secretNameEl = document.getElementById('secret-name');
            if (secretNameEl) secretNameEl.innerText = `For ${partnerName} 💖`;
            
            const envelopeText = document.querySelector('.letter p');
            if (envelopeText && window.magicalState.envelopeMsg) {
                envelopeText.innerHTML = `${window.magicalState.envelopeMsg}<br><br>Hope you like this little surprise!`;
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
                // If empty, the CSS camera placeholder takes over automatically
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

        // ==========================================
    // 💳 3. RAZORPAY ATOMIC TRANSACTION 
    // ==========================================
    const payBtn = document.getElementById('pay-now-btn');
    if(payBtn) {
        payBtn.addEventListener('click', async function(e){
            e.preventDefault();
            payBtn.innerText = "Securing Magic...";
            payBtn.disabled = true;

            try {
                // 1. Send Payload & Create Order in One Step
                const response = await fetch('/api/create-order', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        partner_name: window.magicalState.partnerName,
                        user_name: window.magicalState.userName,
                        envelope_msg: window.magicalState.envelopeMsg,
                        main_wish: window.magicalState.mainWish,
                        audio_link: window.magicalState.audioLink,
                        images: window.magicalState.images,
                        scratch_msgs: window.magicalState.scratchMsgs
                    })
                });
                
                const order = await response.json();

                if(order.error) throw new Error(order.error);

                                
                var options = {
                    "key": "rzp_test_TLeNXeVeDyigeU", // Make sure this matches your Vercel Env Var
                    "amount": "9900",
                    "currency": "INR",
                    "name": "Magical Surprises",
                    "order_id": order.id, 
                    "handler": function (payment_response){
                        payBtn.innerText = "Link Generated ✔";
                        payBtn.style.background = "linear-gradient(to right, #27ae60, #2ecc71)";
                        
                        const frontend_url = window.location.origin;
                        const gift_link = `${frontend_url}/?gift=${order.gift_id}`;
                        
                        // 1. POPULATE AND SHOW THE BEAUTIFUL MODAL
                        const successModal = document.getElementById('success-modal');
                        const linkInput = document.getElementById('generated-link-input');
                        if (linkInput) linkInput.value = gift_link;
                        if (successModal) successModal.classList.add('show');

                        // 2. SHOW THE PERSISTENT COPY BUTTON ON SCREEN 8
                        const persistentBtn = document.getElementById('persistent-copy-btn');
                        if (persistentBtn) {
                            persistentBtn.style.display = 'block';
                            
                            // 3. HIDE IT AUTOMATICALLY AFTER 5 MINUTES (300,000 milliseconds)
                            setTimeout(() => {
                                persistentBtn.style.display = 'none';
                            }, 300000);
                        }
                    },
                    "theme": { "color": "#c0392b" }
                };
                
                var rzp = new Razorpay(options);
                rzp.on('payment.failed', function (response){
                    payBtn.innerText = "Pay Now (₹99)";
                    payBtn.disabled = false;
                });
                rzp.open();
            } catch (error) {
                console.error("Payment System Error:", error);
                alert("System Error: " + error.message); 
                payBtn.innerText = "Pay Now (₹99)";
                payBtn.disabled = false;
            }
        });
    }
});

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
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0`;
                iframe.style.display = 'none';
                iframe.allow = 'autoplay';
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
                // Apply shadow fade effect after 1 second
                const giantPeng = document.getElementById('giant-penguin-img');
                if(giantPeng) giantPeng.classList.add('hide-shadow');
                
                // Wait 500ms for animation to finish, then show archery
                setTimeout(() => {
                    showScreen("archery-screen");
                }, 500);
                
            }, 3800); // 1500ms = 5.4 second exactly
            
        }, 1500);
    });
}

// --- BASIC NAVIGATION ---
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

document.querySelectorAll('.mini-card').forEach(card => {
    card.addEventListener('click', () => {
        playPopSound();
        const cardId = card.getAttribute('data-id');
        const customMsg = window.magicalState.scratchMsgs[cardId] || "A special message for you!";
        
        if(modalContent) {
            modalContent.innerHTML = `<span style="font-size: 1.3rem; font-weight: bold; color: var(--primary-color); font-family: 'Fredoka', sans-serif; line-height: 1.4; display: block; padding: 10px;">${customMsg.replace(/\n/g, '<br>')}</span>`;
        }

        if(modal) modal.classList.add('show');
        
        // BUG FIX: Wait 550ms so the CSS modal animation completely finishes 
        // before calculating the exact width/height of the scratch canvas!
        setTimeout(initPopupScratchCard, 550);
    });
});

// --- ENVELOPE LOGIC ---
const envelopeWrapper = document.getElementById("envelope-wrapper");
if (envelopeWrapper) {
    envelopeWrapper.addEventListener("click", () => {
        if (!envelopeWrapper.classList.contains("open")) { playPopSound(); fireConfetti(); }
        envelopeWrapper.classList.add("open");
        const clickHint = document.querySelector(".click-hint");
        if (clickHint) clickHint.style.display = "none"; 
        setTimeout(() => {
            const btn = document.getElementById("envelopeNextBtn");
            if(btn) btn.style.display = "inline-block";
        }, 1000);
    });
}
document.getElementById("envelopeNextBtn")?.addEventListener("click", () => { playPopSound(); showScreen("screen5"); });

// --- BACKGROUND PARTICLES ---
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
        // --- BACKGROUND PARTICLES (PHASE 3 FIX) ---
    function animateParticles() {
        // Only run the heavy canvas math if the user is actively looking at the page
        if (document.visibilityState === 'visible') {
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
        }
        requestAnimationFrame(animateParticles);
    }
    
    // Start the loop
    animateParticles();
}

// --- TYPEWRITER ---
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
            const exportBtn = document.getElementById('export-trigger-btn');
    if (exportBtn) exportBtn.style.display = 'block';}
    }
    typing();
}
// --- THE ULTIMATE BULLETPROOF SCRATCH CARD ---
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

    let isDrawing = false;
    let lastAudioTime = 0;

    // Get exact coordinates safely
    function getTouchPos(e) {
        const r = scratchCanvas.getBoundingClientRect();
        return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
    }
    function getMousePos(e) {
        const r = scratchCanvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }

    // The Erase Function
    function scratchDraw(x, y) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 45, 0, Math.PI * 2);
        ctx.fill();

        const now = Date.now();
        if (now - lastAudioTime > 150) { 
            if (scratchSound) { scratchSound.currentTime = 0; scratchSound.play().catch(()=>{}); }
            lastAudioTime = now;
        }
    }

    // Mouse Events (For Desktop testing)
    scratchCanvas.onmousedown = (e) => { isDrawing = true; const pos = getMousePos(e); scratchDraw(pos.x, pos.y); };
    scratchCanvas.onmouseup = () => { isDrawing = false; };
    scratchCanvas.onmousemove = (e) => { if(isDrawing) { const pos = getMousePos(e); scratchDraw(pos.x, pos.y); } };

    // Touch Events (CRITICAL: preventDefault stops the screen from scrolling!)
    scratchCanvas.ontouchstart = (e) => { e.preventDefault(); isDrawing = true; const pos = getTouchPos(e); scratchDraw(pos.x, pos.y); };
    scratchCanvas.ontouchend = () => { isDrawing = false; };
    scratchCanvas.ontouchmove = (e) => { e.preventDefault(); if(isDrawing) { const pos = getTouchPos(e); scratchDraw(pos.x, pos.y); } };
}
// --- PARALLAX OPTIMIZATION ---
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

// --- PARALLAX OPTIMIZATION (PHASE 3: GPU HARDWARE ACCELERATION) ---
function renderParallax() {
    // Only animate if the phone is actually moving to save battery/CPU
    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        currentX += (targetX - currentX) * 0.1; 
        currentY += (targetY - currentY) * 0.1;
        
        const activeScreen = document.querySelector(".screen.active");
        if (activeScreen) {
            // Fetch elements once per frame, apply 3D transform to force GPU rendering
            const movingEls = activeScreen.querySelectorAll(".character, .glass, .envelope-wrapper, .cake, .flowers");
            for (let i = 0; i < movingEls.length; i++) {
                const el = movingEls[i];
                const depth = el.classList.contains('glass') ? 0.4 : 1;
                // BUG FIX: translate3d forces Hardware Acceleration, eliminating the lag
                el.style.transform = `translate3d(${currentX * depth}px, ${currentY * depth}px, 0)`;
            }
        }
    }
    requestAnimationFrame(renderParallax);
}
renderParallax();

// --- INSTAGRAM DOUBLE TAP & LIGHTBOX ---
const photoModal = document.getElementById('photo-modal');
const modalImage = document.getElementById('modal-image');
const closePhotoModalBtn = document.getElementById('close-photo-modal');

document.querySelectorAll('.ig-card').forEach(card => {
    let lastTap = 0;
    let tapTimer;
// 🚀 ADD THIS LINE TO KILL THE NATIVE LONG-PRESS MENU:
    card.addEventListener('contextmenu', (e) => e.preventDefault());
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
    });
}
// --- NEW ARCHERY "TAP ANYWHERE" LOGIC ---
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
                
                // BUG FIX: Reset the archery stage silently in the background for replayability 
                setTimeout(() => {
                    hasShot = false;
                    theBow.classList.remove('fly', 'hidden');
                    theHeart.classList.remove('burst');
                    if(tapText) tapText.style.opacity = '1';
                }, 1000);
            }, 4200);

        }, 350); 
    });
}

// ==========================================
// 🕊️ NEW: SUCCESS MODAL & COPY LOGIC
// ==========================================
const successModal = document.getElementById('success-modal');
const closeSuccessModalBtn = document.getElementById('close-success-modal');
const modalCopyBtn = document.getElementById('modal-copy-btn');
const generatedLinkInput = document.getElementById('generated-link-input');
const copyStatus = document.getElementById('copy-status');
const persistentBtn = document.getElementById('persistent-copy-btn');

// Close the modal when 'X' is clicked
if (closeSuccessModalBtn) {
    closeSuccessModalBtn.addEventListener('click', () => {
        if (successModal) successModal.classList.remove('show');
    });
}

// Re-open the modal if they click the 5-minute persistent button on Screen 8
if (persistentBtn) {
    persistentBtn.addEventListener('click', () => {
        if (successModal) successModal.classList.add('show');
    });
}

// Copy the link to the phone's clipboard safely
if (modalCopyBtn && generatedLinkInput) {
    modalCopyBtn.addEventListener('click', () => {
        // Select the text (Helps mobile browsers know what to copy)
        generatedLinkInput.select();
        generatedLinkInput.setSelectionRange(0, 99999); 
        
        // Modern Clipboard API with fallback for older phones/webviews
        try {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(generatedLinkInput.value).then(showCopiedFeedback);
            } else {
                document.execCommand("copy");
                showCopiedFeedback();
            }
        } catch (err) {
            document.execCommand("copy");
            showCopiedFeedback();
        }
    });
}

// Visual feedback for the customer
function showCopiedFeedback() {
    if (copyStatus) {
        copyStatus.style.opacity = '1';
        modalCopyBtn.innerText = "✔ COPIED";
        modalCopyBtn.style.background = "#218838";
        
        // Reset the button visual after 3 seconds
        setTimeout(() => {
            copyStatus.style.opacity = '0';
            modalCopyBtn.innerText = "📋 COPY";
            modalCopyBtn.style.background = "#27ae60";
        }, 3000);
    }
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
        // STRICT LOCKDOWN: If it's a receiver link, permanently destroy the creator form & pay button
        if (orderForm) orderForm.remove(); 
        if (payBtn) payBtn.remove();
        
        if (preloader) { preloader.style.opacity = '1'; preloader.style.visibility = 'visible'; }
        
        try {
            const response = await fetch(`/api/get-gift/${giftId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                const data = result.data;
                const secretNameEl = document.getElementById('secret-name');
                if (secretNameEl) secretNameEl.innerText = `For ${data.partner_name} 💖`;
                // 👇 ADD THESE THREE LINES TO REVEAL THE BUTTON 👇
    const exportBtn = document.getElementById('export-trigger-btn');
    if (exportBtn) {
        exportBtn.style.setProperty('display', 'block', 'important');
    }
                
                const dummyUser = document.getElementById('dummy-username');
                if (dummyUser) dummyUser.value = data.partner_name;
                
                const envelopeText = document.querySelector('.letter p');
                if (envelopeText && data.envelope_msg) envelopeText.innerHTML = `${data.envelope_msg}<br><br>Hope you like this little surprise!`;
                
                const finalMsg = document.getElementById('final-message');
                if (finalMsg && data.main_wish) finalMsg.innerHTML = data.main_wish.replace(/\n/g, '<br>'); 
                
                // Hydrate Images
                if (data.images) {
                    const galleryImgs = document.querySelectorAll('.gallery-img');
                    galleryImgs.forEach((img, index) => {
                        const imgUrl = data.images[index] || data.images[index.toString()];
                        if (imgUrl) img.src = imgUrl;
                    });
                }
                
                // Hydrate Custom Scratch Messages
                if (data.scratch_msgs) {
                    window.magicalState.scratchMsgs = data.scratch_msgs;
                }
                
                if (data.audio_link) { window.magicalState = window.magicalState || {}; window.magicalState.receiverAudio = data.audio_link; }
                
                if (previewContainer) previewContainer.style.display = 'block';
                if (loginScreen) { loginScreen.style.display = 'flex'; loginScreen.classList.add('active'); }
            } else {
                alert("Oops! This magical link seems broken or has expired.");
            }
        } catch (error) {
            console.error("Failed to load gift data:", error);
            alert("Error loading the surprise. Please refresh the page.");
        } finally {
            if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600); }
        }
    } else {
        if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600); }
    }
});
// ==========================================
// 🚀 PHASE 3: VIRAL EXPORT ENGINE LOGIC
// ==========================================

function initExportViralLoop() {
    const exportBtn = document.getElementById('export-trigger-btn');
    const exportModal = document.getElementById('export-modal');
    const closeExportBtn = document.getElementById('close-export-modal');
    const styleBtns = document.querySelectorAll('.style-btn');
    const dynamicContainer = document.getElementById('dynamic-template-container');

    // 1. Modal Toggle Logic
    if (exportBtn && exportModal) {
        exportBtn.addEventListener('click', () => {
            exportModal.classList.add('show');
        });
    }
    
    if (closeExportBtn && exportModal) {
        closeExportBtn.addEventListener('click', () => {
            exportModal.classList.remove('show');
        });
    }

    // 2. QR Code Generator
    function generateQRCode() {
        const qrContainer = document.getElementById('qrcode-container');
        if (!qrContainer) return;
        qrContainer.innerHTML = ''; 
        const currentUrl = window.location.href;
        new QRCode(qrContainer, {
            text: currentUrl,
            width: 140,
            height: 140,
            colorDark: "#5a1829", 
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    // 3. Color Thief Engine (With 3-second safety killswitch)
    function applyDominantColor(imageUrl) {
        return new Promise((resolve) => {
            if (!imageUrl) return resolve();

            const img = new Image();
            img.crossOrigin = 'Anonymous'; 
            
            const safetyTimeout = setTimeout(() => {
                console.warn("ColorThief timed out. Using default background.");
                resolve();
            }, 3000);

            img.onload = () => {
                clearTimeout(safetyTimeout); 
                try {
                    const colorThief = new ColorThief();
                    const color = colorThief.getColor(img);
                    const dominantRgb = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3)`;
                    const stage = document.getElementById('export-stage');
                    
                    if (stage) {
                        stage.style.background = `linear-gradient(135deg, ${dominantRgb} 0%, #fdfbfb 100%)`;
                    }
                    resolve();
                } catch (error) {
                    resolve();
                }
            };
            
            img.onerror = () => {
                clearTimeout(safetyTimeout);
                resolve();
            };
            img.src = imageUrl;
        });
    }
    // 4. Template Builders (FIXED: Removed CORS tags that crash Base64 images)
    function buildFilmStrip() {
        let imagesHtml = '';
        for(let i = 0; i < 3; i++) {
            if(window.magicalState.images[i]) {
                imagesHtml += `<img src="${window.magicalState.images[i]}" class="film-img">`;
            }
        }
        return `<div class="film-strip-container">${imagesHtml}</div>`;
    }

    function buildPolaroid() {
        const imgSrc = window.magicalState.images[0] || '';
        const name = window.magicalState.partnerName || 'Someone Special';
        return `
            <div class="polaroid-frame">
                ${imgSrc ? `<img src="${imgSrc}">` : '<div style="width:850px;height:850px;background:#eee;"></div>'}
                <div class="polaroid-text">For ${name}</div>
            </div>
        `;
    }

    function buildGhazal() {
        const imgSrc = window.magicalState.images[0] || '';
        const poem = window.magicalState.mainWish || 'A beautiful memory...';
        return `
            ${imgSrc ? `<img src="${imgSrc}" class="ghazal-bg">` : ''}
            <div class="poem-card">
                <p class="ghazal-text">${poem}</p>
            </div>
        `;
    }
    
    // 5. Wire up the Style Selection Buttons (NOW FULLY WIRED TO DOWNLOAD)
    styleBtns.forEach(btn => {
        // NOTICE: This must be async to await the download
        btn.addEventListener('click', async (e) => {
            const templateType = e.target.getAttribute('data-template');
            const primaryImage = window.magicalState.images[0];
            
            dynamicContainer.innerHTML = '';
            generateQRCode();
            await applyDominantColor(primaryImage);

            if (templateType === 'film-strip') {
                dynamicContainer.innerHTML = buildFilmStrip();
            } else if (templateType === 'polaroid') {
                dynamicContainer.innerHTML = buildPolaroid();
            } else if (templateType === 'ghazal') {
                dynamicContainer.innerHTML = buildGhazal();
            }

            // 🚀 CRITICAL FIX: The missing trigger hook is now safely executed
            await triggerHtml2CanvasDownload(e.target);
        });
    });
}
// Add this to the bottom of script.js
async function triggerHtml2CanvasDownload(button) {
    const stageWrapper = document.getElementById('export-wrapper');
    const stage = document.getElementById('export-stage');
    const loader = document.getElementById('export-loader');
    const originalText = button.innerHTML;

    try {
        // UI Feedback
        button.innerHTML = 'Rendering Magic... ✨';
        loader.style.display = 'flex';

        // Bring it to the viewport but keep it practically invisible
        stageWrapper.style.top = '0';
        stageWrapper.style.left = '0';
        stageWrapper.style.opacity = '0.01';
        stageWrapper.style.zIndex = '-1';

        // BUG FIX: Give the browser 300ms to actually render the CSS changes before taking the screenshot
        await new Promise(resolve => setTimeout(resolve, 300));

        const canvas = await html2canvas(stage, {
            scale: 2, 
            useCORS: true,
            // allowTaint has been removed because it explicitly blocks mobile image downloads!
            backgroundColor: null
        });

        // Push it back off-screen immediately
        stageWrapper.style.top = '-9999px';
        stageWrapper.style.opacity = '1';

        // Trigger native download
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.download = 'Beautiful_Memory.jpg';
        link.href = dataUrl;
        link.click();

    } catch (error) {
        console.error("Export failed:", error);
        alert("Failed to save memory. Please try again.");
        stageWrapper.style.top = '-9999px'; // Reset safely on error
    } finally {
        // Restore UI
        button.innerHTML = originalText;
        loader.style.display = 'none';
    }
}

// ==========================================
// 🚀 CRITICAL FIX: INITIALIZE EXPORT ENGINE
// ==========================================

// 1. Turn the export engine on
if (typeof initExportViralLoop === "function") {
    initExportViralLoop();
}

// 2. Wire up the final "Save this Memory" button to open the modal
document.addEventListener("DOMContentLoaded", () => {
    const finalExportBtn = document.getElementById('export-trigger-btn');
    const exportModalUI = document.getElementById('export-modal');
    
    if (finalExportBtn && exportModalUI) {
        finalExportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            exportModalUI.classList.add('show');
        });
    }
});
