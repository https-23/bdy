// ==========================================
// 🧠 1. GLOBAL STATE & COMPRESSION ENGINE
// ==========================================
window.magicalState = {
    partnerName: "", userName: "", envelopeMsg: "", mainWish: "", audioLink: "",
    images: { 0: null, 1: null, 2: null, 3: null },
    scratchMsgs: { 1: "", 2: "", 3: "", 4: "" }
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
                const MAX_WIDTH = 600; // Phase 4 Memory Optimization
                const MAX_HEIGHT = 600;
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', 0.4)); // Fast upload optimization
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
// 📸 2. UI INITIALIZATION & FORM HANDLING
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // Photo Upload Logic
    const photoBoxes = document.querySelectorAll('.photo-upload-box');
    photoBoxes.forEach((box, index) => {
        box.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'input') return;
            const fileInput = box.querySelector('input[type="file"]');
            if (fileInput) { fileInput.value = null; fileInput.click(); }
        });

        const fileInput = box.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener('change', async function(e) {
                const file = e.target.files[0];
                if (file) {
                    try {
                        const base64Data = await compressImage(file);
                        window.magicalState.images[index] = base64Data;
                        box.style.backgroundImage = `url('${base64Data}')`;
                        box.style.backgroundSize = 'cover';
                        box.style.backgroundPosition = 'center';
                        box.style.border = 'none';
                        const plusIcon = box.querySelector('.upload-icon');
                        if (plusIcon) plusIcon.style.display = 'none';
                        const textHint = box.querySelector('.upload-text');
                        if (textHint) textHint.style.display = 'none';
                    } catch (error) {
                        console.error("Compression failed:", error);
                        alert("Could not process this image.");
                    }
                }
            });
        }
    });

    const aiBtn = document.getElementById('ai-generate-btn'); 
    const wishTextarea = document.getElementById('main-wish-msg'); 
    if (aiBtn && wishTextarea) {
        aiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            wishTextarea.value = "You turn the most ordinary days into something worth remembering — a random Tuesday feels a little more magical just because you're in it. 💖";
        });
    }

    // Preview Button Logic
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const partnerNameInput = document.getElementById('partner-name-input');
            const partnerName = partnerNameInput ? partnerNameInput.value.trim() : '';
            if (!partnerName) { alert("Please enter the name first! ✨"); return; }

            window.magicalState.partnerName = partnerName;
            window.magicalState.userName = document.getElementById('user-name-input')?.value.trim() || "";
            window.magicalState.envelopeMsg = document.getElementById('envelope-msg')?.value.trim() || "";
            window.magicalState.mainWish = document.getElementById('main-wish-msg')?.value.trim() || "";
            window.magicalState.audioLink = document.getElementById('audio-link-input')?.value.trim() || "";
            
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
                if (window.magicalState.images[index]) { img.src = window.magicalState.images[index]; }
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
            if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600); }
        });
    }

    // Secure Pay Button Logic
    const payBtn = document.getElementById('pay-now-btn');
    if(payBtn) {
        payBtn.addEventListener('click', async function(e){
            e.preventDefault();
            payBtn.innerText = "Securing Magic...";
            payBtn.disabled = true;
            try {
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
                    "key": "rzp_test_TLeNXeVeDyigeU", 
                    "amount": "9900", "currency": "INR", "name": "Magical Surprises", "order_id": order.id, 
                    "handler": function (payment_response){
                        payBtn.innerText = "Link Generated ✔";
                        payBtn.style.background = "linear-gradient(to right, #27ae60, #2ecc71)";
                        const frontend_url = window.location.origin;
                        const gift_link = `${frontend_url}/?gift=${order.gift_id}`;
                        const successModal = document.getElementById('success-modal');
                        const linkInput = document.getElementById('generated-link-input');
                        if (linkInput) linkInput.value = gift_link;
                        if (successModal) successModal.classList.add('show');
                        const persistentBtn = document.getElementById('persistent-copy-btn');
                        if (persistentBtn) {
                            persistentBtn.style.display = 'block';
                            setTimeout(() => { persistentBtn.style.display = 'none'; }, 300000);
                        }
                    },
                    "theme": { "color": "#c0392b" }
                };
                var rzp = new Razorpay(options);
                rzp.on('payment.failed', function (response){
                    payBtn.innerText = "PAY ₹99 & GET LINK 🔗";
                    payBtn.disabled = false;
                });
                rzp.open();
            } catch (error) {
                console.error("Payment Error:", error);
                alert("System Error: " + error.message); 
                payBtn.innerText = "PAY ₹99 & GET LINK 🔗";
                payBtn.disabled = false;
            }
        });
    }
});

// ==========================================
// 🎩 3. APP LOGIC & ANIMATIONS
// ==========================================
let typeWriterTriggered = false;

function playPopSound() {
    const pop = document.getElementById("pop-sound");
    if (pop) { pop.currentTime = 0; pop.play().catch(()=>{}); }
}

function fireConfetti() {
    if (typeof confetti !== "undefined") {
        var duration = 3000; var end = Date.now() + duration;
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ffb6c1', '#c0392b', '#ffffff', '#ff758c'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ffb6c1', '#c0392b', '#ffffff', '#ff758c'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
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

// 3D Login Screen
const loginScreen = document.getElementById('login-screen');
const tiltCard = document.getElementById('tilt-card');
const unlockBtn = document.getElementById('unlock-btn');
if (loginScreen && tiltCard) {
    loginScreen.addEventListener('mousemove', (e) => {
        const rect = tiltCard.getBoundingClientRect();
        const x = e.clientX - (rect.left + rect.width / 2);
        const y = e.clientY - (rect.top + rect.height / 2);
        tiltCard.style.transform = `rotateX(${-(y / 15).toFixed(2)}deg) rotateY(${(x / 15).toFixed(2)}deg)`;
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
        const btnText = unlockBtn.querySelector('.btn-text');
        const btnLoader = unlockBtn.querySelector('.loader');
        if(btnText && btnLoader) { btnText.classList.add('hidden'); btnLoader.classList.remove('hidden'); }
        playPopSound(); 
        setTimeout(() => {
            const customAudioLink = window.magicalState?.receiverAudio || window.magicalState?.audioLink;
            const videoId = extractYouTubeId(customAudioLink);
            if (videoId) {
                const iframe = document.createElement('iframe');
                iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0`;
                iframe.style.display = 'none'; iframe.allow = 'autoplay'; document.body.appendChild(iframe);
            } else {
                const bgMusic = document.getElementById("bg-music");
                if (bgMusic) { bgMusic.volume = 0.5; bgMusic.play().catch(e => {}); }
            }
            showScreen("big-penguin-screen");
            setTimeout(() => {
                const giantPeng = document.getElementById('giant-penguin-img');
                if(giantPeng) giantPeng.classList.add('hide-shadow');
                setTimeout(() => { showScreen("archery-screen"); }, 500);
            }, 3800);
        }, 1500);
    });
}

// Basic Navigation
document.getElementById("yesBtn")?.addEventListener("click", () => { playPopSound(); showScreen("screen2"); });
document.getElementById("noBtn")?.addEventListener("click", () => { playPopSound(); showScreen("angry"); });
document.getElementById("tryAgain")?.addEventListener("click", () => { playPopSound(); showScreen("screen1"); });
document.getElementById("screen2")?.addEventListener("click", (e) => { if(!e.target.classList.contains("backBtn")) { playPopSound(); showScreen("screen3"); } });

const nextMap = { "#screen3 .heartNext": "screen4", "#screen5 .heartNext": "screen6", "#screen6 .heartNext": "screen7", "#screen7 .heartNext": "screen8" };
Object.keys(nextMap).forEach(selector => { document.querySelector(selector)?.addEventListener("click", () => { playPopSound(); showScreen(nextMap[selector]); }); });

document.querySelectorAll(".backBtn").forEach(btn => {
    btn.addEventListener("click", (e) => { e.stopPropagation(); playPopSound(); showScreen(btn.getAttribute("data-back")); });
});

// Envelope logic
const envelopeWrapper = document.getElementById("envelope-wrapper");
if (envelopeWrapper) {
    envelopeWrapper.addEventListener("click", () => {
        if (!envelopeWrapper.classList.contains("open")) { playPopSound(); fireConfetti(); }
        envelopeWrapper.classList.add("open");
        const clickHint = document.querySelector(".click-hint");
        if (clickHint) clickHint.style.display = "none"; 
        setTimeout(() => { const btn = document.getElementById("envelopeNextBtn"); if(btn) btn.style.display = "inline-block"; }, 1000);
    });
}
document.getElementById("envelopeNextBtn")?.addEventListener("click", () => { playPopSound(); showScreen("screen5"); });

// Archery logic
const archeryScreen = document.getElementById('archery-screen');
const theBow = document.getElementById('the-bow');
const theHeart = document.getElementById('the-heart');
let hasShot = false;
if (archeryScreen) {
    archeryScreen.addEventListener('click', () => {
        if (hasShot) return; hasShot = true;
        const tapText = archeryScreen.querySelector('.swipe');
        if(tapText) tapText.style.opacity = '0';
        theBow.classList.add('fly');
        setTimeout(() => {
            theBow.classList.add('hidden'); theHeart.classList.add('burst'); fireConfetti(); playPopSound();
            setTimeout(() => {
                showScreen('screen1');
                setTimeout(() => {
                    hasShot = false; theBow.classList.remove('fly', 'hidden'); theHeart.classList.remove('burst');
                    if(tapText) tapText.style.opacity = '1';
                }, 1000);
            }, 4200);
        }, 350); 
    });
}

// Canvas Background Particles
const pCanvas = document.getElementById("particle-canvas");
if (pCanvas) {
    const pCtx = pCanvas.getContext("2d");
    let particles = []; const emojis = ["🌸", "💖", "✨", "🌸", "🤍"];
    function resizeCanvas() { pCanvas.width = window.innerWidth; pCanvas.height = window.innerHeight; }
    window.addEventListener('resize', resizeCanvas); resizeCanvas();
    class Particle {
        constructor() { this.reset(); this.y = Math.random() * pCanvas.height; }
        reset() { this.x = Math.random() * pCanvas.width; this.y = -50; this.size = Math.random() * 15 + 15; this.speed = Math.random() * 2 + 1.5; this.emoji = emojis[Math.floor(Math.random() * emojis.length)]; this.rotation = Math.random() * 360; this.rotationSpeed = (Math.random() - 0.5) * 2; }
        update() { this.y += this.speed; this.rotation += this.rotationSpeed; if (this.y > pCanvas.height + 50) this.reset(); }
        draw() { pCtx.save(); pCtx.translate(this.x, this.y); pCtx.rotate(this.rotation * Math.PI / 180); pCtx.font = `${this.size}px Arial`; pCtx.textAlign = "center"; pCtx.textBaseline = "middle"; pCtx.globalAlpha = 0.6; pCtx.fillText(this.emoji, 0, 0); pCtx.restore(); }
    }
    for (let i = 0; i < 30; i++) particles.push(new Particle());
    function animateParticles() { if (document.visibilityState === 'visible') { pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height); particles.forEach(p => { p.update(); p.draw(); }); } requestAnimationFrame(animateParticles); }
    animateParticles();
}

// Glowing Typewriter
function triggerTypewriter() {
    const pElement = document.getElementById("final-message");
    if (!pElement) return;
    const text = pElement.innerHTML.replace(/<br\s*\/?>/gi, '\n').trim(); pElement.innerHTML = ""; let i = 0;
    function typing() {
        if (i < text.length) { pElement.innerHTML += (text.charAt(i) === '\n') ? "<br>" : text.charAt(i); i++; setTimeout(typing, 35); } 
        else { const exportBtn = document.getElementById('export-trigger-btn'); if (exportBtn) exportBtn.style.display = 'block'; }
    }
    typing();
}

// ==========================================
// 🎁 4. THE BULLETPROOF SCRATCH CARDS
// ==========================================
// ==========================================
// 🎁 4. THE BULLETPROOF SCRATCH CARDS
// ==========================================
const modal = document.getElementById('scratch-modal');
const modalContent = document.getElementById('modal-message-content');

document.querySelectorAll('.mini-card').forEach(card => {
    card.addEventListener('click', () => {
        playPopSound();
        const cardId = card.getAttribute('data-id');
        const customMsg = window.magicalState.scratchMsgs[cardId] || "A special message for you!";
        if(modalContent) modalContent.innerHTML = `<span style="font-size: 1.3rem; font-weight: bold; color: var(--primary-color); font-family: 'Fredoka', sans-serif; line-height: 1.4; display: block; padding: 10px;">${customMsg.replace(/\n/g, '<br>')}</span>`;
        if(modal) modal.classList.add('show');
        setTimeout(initPopupScratchCard, 550);
    });
});

document.getElementById('close-modal')?.addEventListener('click', () => { playPopSound(); if(modal) modal.classList.remove('show'); });

function initPopupScratchCard() {
    const scratchCanvas = document.getElementById('popup-scratch-pad');
    if(!scratchCanvas) return;
    const ctx = scratchCanvas.getContext('2d', { willReadFrequently: true }); 
    const rect = scratchCanvas.parentElement.getBoundingClientRect();
    scratchCanvas.width = rect.width; scratchCanvas.height = rect.height;
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#b3b3b3'; ctx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
    ctx.font = "bold 24px 'Fredoka', sans-serif"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Scratch Me! ✨", scratchCanvas.width / 2, scratchCanvas.height / 2);

    let isDrawing = false; let lastAudioTime = 0; const scratchSound = document.getElementById('scratch-sound');
    function getTouchPos(e) { const r = scratchCanvas.getBoundingClientRect(); return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }; }
    function getMousePos(e) { const r = scratchCanvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function scratchDraw(x, y) {
        ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x, y, 45, 0, Math.PI * 2); ctx.fill();
        const now = Date.now();
        if (now - lastAudioTime > 150) { if (scratchSound) { scratchSound.currentTime = 0; scratchSound.play().catch(()=>{}); } lastAudioTime = now; }
    }
    scratchCanvas.onmousedown = (e) => { isDrawing = true; const pos = getMousePos(e); scratchDraw(pos.x, pos.y); };
    scratchCanvas.onmouseup = () => { isDrawing = false; };
    scratchCanvas.onmousemove = (e) => { if(isDrawing) { const pos = getMousePos(e); scratchDraw(pos.x, pos.y); } };
    
    scratchCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; const pos = getTouchPos(e); scratchDraw(pos.x, pos.y); }, {passive: false});
    scratchCanvas.addEventListener('touchend', () => { isDrawing = false; }, {passive: false});
    scratchCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); if(isDrawing) { const pos = getTouchPos(e); scratchDraw(pos.x, pos.y); } }, {passive: false});
}

// Parallax Animation Loop
let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
function throttle(func, limit) { let inThrottle; return function(...args) { if (!inThrottle) { func.apply(this, args); inThrottle = true; setTimeout(() => inThrottle = false, limit); } }; }
window.addEventListener("deviceorientation", throttle((e) => { if (!e.gamma || !e.beta) return; let tiltX = e.gamma; let tiltY = e.beta; if (tiltX > 25) tiltX = 25; if (tiltX < -25) tiltX = -25; if (tiltY > 55) tiltY = 55; if (tiltY < 25) tiltY = 25; targetX = (tiltX / 25) * 15; targetY = ((tiltY - 40) / 15) * 15; }, 20));
document.addEventListener("mousemove", throttle((e) => { targetX = (e.clientX / window.innerWidth - 0.5) * 30; targetY = (e.clientY / window.innerHeight - 0.5) * 30; }, 20));
function renderParallax() {
    if (Math.abs(targetX - currentX) > 0.1 || Math.abs(targetY - currentY) > 0.1) {
        currentX += (targetX - currentX) * 0.1; currentY += (targetY - currentY) * 0.1;
        const activeScreen = document.querySelector(".screen.active");
        if (activeScreen) {
            const movingEls = activeScreen.querySelectorAll(".character, .glass, .envelope-wrapper, .cake, .flowers");
            for (let i = 0; i < movingEls.length; i++) {
                const depth = movingEls[i].classList.contains('glass') ? 0.4 : 1;
                movingEls[i].style.transform = `translate3d(${currentX * depth}px, ${currentY * depth}px, 0)`;
            }
        }
    }
    requestAnimationFrame(renderParallax);
}
renderParallax();

// Instagram Gallery
const photoModal = document.getElementById('photo-modal'); const modalImage = document.getElementById('modal-image'); const closePhotoModalBtn = document.getElementById('close-photo-modal');
document.querySelectorAll('.ig-card').forEach(card => {
    let lastTap = 0; let tapTimer; card.addEventListener('contextmenu', (e) => e.preventDefault());
    card.addEventListener('click', (e) => {
        const tapLength = new Date().getTime() - lastTap;
        if (tapLength < 300 && tapLength > 0) {
            clearTimeout(tapTimer); e.preventDefault();
            if ("vibrate" in navigator) navigator.vibrate([30, 50, 30]); 
            const heart = document.createElement('div'); heart.classList.add('popup-heart'); heart.innerText = '❤️'; card.appendChild(heart); setTimeout(() => heart.remove(), 1000);
        } else {
            tapTimer = setTimeout(() => { playPopSound(); const img = card.querySelector('.gallery-img'); if(img && modalImage && photoModal) { modalImage.src = img.src; photoModal.classList.add('show'); } }, 300); 
        }
        lastTap = new Date().getTime();
    });
});
if(closePhotoModalBtn) closePhotoModalBtn.addEventListener('click', () => { playPopSound(); if(photoModal) photoModal.classList.remove('show'); });

// Copy Link Modal
const successModal = document.getElementById('success-modal');
const closeSuccessModalBtn = document.getElementById('close-success-modal');
const modalCopyBtn = document.getElementById('modal-copy-btn');
const generatedLinkInput = document.getElementById('generated-link-input');
const copyStatus = document.getElementById('copy-status');
const persistentBtn = document.getElementById('persistent-copy-btn');
if (closeSuccessModalBtn) closeSuccessModalBtn.addEventListener('click', () => { if (successModal) successModal.classList.remove('show'); });
if (persistentBtn) persistentBtn.addEventListener('click', () => { if (successModal) successModal.classList.add('show'); });
if (modalCopyBtn && generatedLinkInput) {
    modalCopyBtn.addEventListener('click', () => {
        generatedLinkInput.select(); generatedLinkInput.setSelectionRange(0, 99999); 
        try { navigator.clipboard.writeText(generatedLinkInput.value).then(showCopiedFeedback); } catch (err) { document.execCommand("copy"); showCopiedFeedback(); }
    });
}
function showCopiedFeedback() {
    if (copyStatus) {
        copyStatus.style.opacity = '1'; modalCopyBtn.innerText = "✔ COPIED"; modalCopyBtn.style.background = "#218838";
        setTimeout(() => { copyStatus.style.opacity = '0'; modalCopyBtn.innerText = "📋 COPY"; modalCopyBtn.style.background = "#27ae60"; }, 3000);
    }
}

// ==========================================
// 🚀 5. RECEIVER DATA HYDRATION
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const giftId = urlParams.get('gift');
if (giftId) {
    const orderForm = document.getElementById('order-form-container'); const payBtn = document.getElementById('pay-now-btn');
    if (orderForm) orderForm.remove(); if (payBtn) payBtn.remove();
    const preloader = document.getElementById('preloader');
    if (preloader) { preloader.style.opacity = '1'; preloader.style.visibility = 'visible'; }
    
    fetch(`/api/get-gift/${giftId}`).then(res => res.json()).then(result => {
        if (result.status === 'success') {
            const data = result.data;
            const secretNameEl = document.getElementById('secret-name'); if (secretNameEl) secretNameEl.innerText = `For ${data.partner_name} 💖`;
            const exportBtn = document.getElementById('export-trigger-btn'); if (exportBtn) exportBtn.style.setProperty('display', 'block', 'important');
            const dummyUser = document.getElementById('dummy-username'); if (dummyUser) dummyUser.value = data.partner_name;
            const envelopeText = document.querySelector('.letter p'); if (envelopeText && data.envelope_msg) envelopeText.innerHTML = `${data.envelope_msg}<br><br>Hope you like this little surprise!`;
            const finalMsg = document.getElementById('final-message'); if (finalMsg && data.main_wish) finalMsg.innerHTML = data.main_wish.replace(/\n/g, '<br>'); 
            if (data.images) { document.querySelectorAll('.gallery-img').forEach((img, index) => { const imgUrl = data.images[index] || data.images[index.toString()]; if (imgUrl) img.src = imgUrl; }); }
            if (data.scratch_msgs) window.magicalState.scratchMsgs = data.scratch_msgs;
            if (data.audio_link) { window.magicalState = window.magicalState || {}; window.magicalState.receiverAudio = data.audio_link; }
            const previewContainer = document.getElementById('preview-container'); if (previewContainer) previewContainer.style.display = 'block';
            const loginScreen = document.getElementById('login-screen'); if (loginScreen) { loginScreen.style.display = 'flex'; loginScreen.classList.add('active'); }
        } else alert("Oops! This magical link seems broken or has expired.");
    }).catch(err => { console.error("Load error:", err); alert("Error loading the surprise."); })
    .finally(() => { if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600); } });
}

// ==========================================
// 🎨 6. VIRAL EXPORT ENGINE
// ==========================================
function initExportViralLoop() {
    const dynamicContainer = document.getElementById('dynamic-template-container');
    function generateQRCode() {
        const qrContainer = document.getElementById('qrcode-container');
        if (!qrContainer) return; qrContainer.innerHTML = ''; 
        new QRCode(qrContainer, { text: window.location.href, width: 140, height: 140, colorDark: "#5a1829", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
    }
    function applyDominantColor(imageUrl) {
        return new Promise((resolve) => {
            if (!imageUrl) return resolve();
            const img = new Image(); img.crossOrigin = 'Anonymous'; 
            const safetyTimeout = setTimeout(() => { resolve(); }, 3000);
            img.onload = () => {
                clearTimeout(safetyTimeout); 
                try {
                    const colorThief = new ColorThief(); const color = colorThief.getColor(img);
                    const stage = document.getElementById('export-stage');
                    if (stage) stage.style.background = `linear-gradient(135deg, rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.3) 0%, #fdfbfb 100%)`;
                    resolve();
                } catch (error) { resolve(); }
            };
            img.onerror = () => { clearTimeout(safetyTimeout); resolve(); }; img.src = imageUrl;
        });
    }
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const templateType = e.target.getAttribute('data-template'); const primaryImage = window.magicalState.images[0];
            dynamicContainer.innerHTML = ''; generateQRCode(); await applyDominantColor(primaryImage);
            if (templateType === 'film-strip') {
                let imagesHtml = ''; for(let i=0; i<3; i++) if(window.magicalState.images[i]) imagesHtml += `<img src="${window.magicalState.images[i]}" class="film-img">`;
                dynamicContainer.innerHTML = `<div class="film-strip-container">${imagesHtml}</div>`;
            } else if (templateType === 'polaroid') {
                const imgSrc = window.magicalState.images[0] || ''; const name = window.magicalState.partnerName || 'Someone Special';
                dynamicContainer.innerHTML = `<div class="polaroid-frame">${imgSrc ? `<img src="${imgSrc}">` : '<div style="width:850px;height:850px;background:#eee;"></div>'}<div class="polaroid-text">For ${name}</div></div>`;
            } else if (templateType === 'ghazal') {
                const imgSrc = window.magicalState.images[0] || ''; const poem = window.magicalState.mainWish || 'A beautiful memory...';
                dynamicContainer.innerHTML = `${imgSrc ? `<img src="${imgSrc}" class="ghazal-bg">` : ''}<div class="poem-card"><p class="ghazal-text">${poem}</p></div>`;
            }
            triggerHtml2CanvasDownload(e.target);
        });
    });
}

async function triggerHtml2CanvasDownload(button) {
    const stageWrapper = document.getElementById('export-wrapper'); const stage = document.getElementById('export-stage'); const loader = document.getElementById('export-loader'); const originalText = button.innerHTML;
    try {
        button.innerHTML = 'Rendering Magic... ✨'; loader.style.display = 'flex';
        stageWrapper.style.top = '0'; stageWrapper.style.left = '0'; stageWrapper.style.opacity = '0.01'; stageWrapper.style.zIndex = '-1';
        await new Promise(resolve => setTimeout(resolve, 300));
        const canvas = await html2canvas(stage, { scale: 2, useCORS: true, backgroundColor: null });
        stageWrapper.style.top = '-9999px'; stageWrapper.style.opacity = '1';
        const link = document.createElement('a'); link.download = 'Beautiful_Memory.jpg'; link.href = canvas.toDataURL('image/jpeg', 0.9); link.click();
    } catch (error) { console.error("Export failed:", error); alert("Failed to save memory."); stageWrapper.style.top = '-9999px'; } 
    finally { button.innerHTML = originalText; loader.style.display = 'none'; }
}

if (typeof initExportViralLoop === "function") initExportViralLoop();

// ==========================================
// 🛡️ 7. ABSOLUTE BUTTON FAILSAFE
// ==========================================
window.addEventListener('load', () => {
    const finalExportBtn = document.getElementById('export-trigger-btn');
    const exportModalUI = document.getElementById('export-modal');
    const closeExportBtn = document.getElementById('close-export-modal');
    if (finalExportBtn && exportModalUI) { finalExportBtn.addEventListener('click', (e) => { e.preventDefault(); exportModalUI.classList.add('show'); }); }
    if (closeExportBtn && exportModalUI) { closeExportBtn.addEventListener('click', () => { exportModalUI.classList.remove('show'); }); }
});
