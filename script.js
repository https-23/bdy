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
                resolve(canvas.toDataURL('image/webp', 0.55));
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
    const photoInputs = document.querySelectorAll('.photo-upload-box input[type="file"]');
    photoInputs.forEach((input, index) => {
        input.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (file) {
                try {
                    const base64Data = await compressImage(file);
                    window.magicalState.images[index] = base64Data;
                    const parentLabel = input.parentElement;
                    if (parentLabel) {
                        parentLabel.style.backgroundImage = `url('${base64Data}')`;
                        parentLabel.style.backgroundSize = 'cover';
                        parentLabel.style.backgroundPosition = 'center';
                        parentLabel.style.border = 'none';
                        const plusIcon = parentLabel.querySelector('.upload-icon') || parentLabel.querySelector('span');
                        if (plusIcon) plusIcon.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Compression failed:", error);
                    alert("Could not process this image. Please try a different one.");
                }
            }
        });
    });

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
                const response = await fetch('/api/create-order', { method: 'POST' });
                const order = await response.json();

                if(order.error) throw new Error(order.error);

                var options = {
                    "key": "rzp_test_TLeNXeVeDyigeU", // Make sure this matches your Vercel Env Var
                    "amount": "9900",
                    "currency": "INR",
                    "name": "Magical Surprises",
                    "order_id": order.id, 
                    "handler": async function (payment_response){
                        payBtn.innerText = "Generating Link..."; 
                        try {
                            const verifyRes = await fetch('/api/verify-and-generate-link', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    order_id: payment_response.razorpay_order_id,
                                    payment_id: payment_response.razorpay_payment_id,
                                    signature: payment_response.razorpay_signature,
                                    partner_name: window.magicalState.partnerName,
                                    user_name: window.magicalState.userName,
                                    envelope_msg: window.magicalState.envelopeMsg,
                                    main_wish: window.magicalState.mainWish,
                                    audio_link: window.magicalState.audioLink,
                                    images: window.magicalState.images,
                                    scratch_msgs: window.magicalState.scratchMsgs // Send custom messages to DB
                                })
                            });
                            
                            const result = await verifyRes.json();
                            if(result.status === "success") {
                                prompt("🎉 Payment Successful! Ye rahi aapki magical link (Copy kar lijiye):", result.link);
                                payBtn.innerText = "Link Generated ✔";
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
                    payBtn.innerText = "Pay Now (₹99)";
                    payBtn.disabled = false;
                });
                rzp.open();
            } catch (error) {
                console.error("Payment System Error:", error);
                alert("Backend Error: " + error.message); 
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
            showScreen("screen1");
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

document.querySelectorAll(".backBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation(); playPopSound(); showScreen(btn.getAttribute("data-back"));
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
    function animateParticles() {
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        requestAnimationFrame(animateParticles);
    }
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
            const secretName = document.getElementById("secret-name");
            if (secretName) secretName.classList.add("show-name");
        }
    }
    typing();
}

// --- CUSTOM SCRATCH CARDS ---
const modal = document.getElementById('scratch-modal');
const modalContent = document.getElementById('modal-message-content');
const scratchCanvas = document.getElementById('popup-scratch-pad');
const scratchSound = document.getElementById('scratch-sound');

document.querySelectorAll('.mini-card').forEach(card => {
    card.addEventListener('click', () => {
        playPopSound();
        const cardId = card.getAttribute('data-id');
        const customMsg = window.magicalState.scratchMsgs[cardId] || "A special message for you!";
        
        // Dynamically style the user's custom text
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

// --- INSTAGRAM DOUBLE TAP & LIGHTBOX ---
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

// ==========================================
// 🔮 5. RECEIVER PAYLOAD HYDRATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const giftId = urlParams.get('gift');
    
    const preloader = document.getElementById('preloader');
    const orderForm = document.getElementById('order-form-container');
    const previewContainer = document.getElementById('preview-container');
    const loginScreen = document.getElementById('login-screen');
    
    if (giftId) {
        if (preloader) { preloader.style.opacity = '1'; preloader.style.visibility = 'visible'; }
        if (orderForm) orderForm.style.display = 'none';
        
        try {
            const response = await fetch(`/api/get-gift/${giftId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            
            if (result.status === 'success') {
                const data = result.data;
                const secretNameEl = document.getElementById('secret-name');
                if (secretNameEl) secretNameEl.innerText = `For ${data.partner_name} 💖`;
                
                const dummyUser = document.getElementById('dummy-username');
                if (dummyUser) dummyUser.value = data.partner_name;
                
                const envelopeText = document.querySelector('.letter p');
                if (envelopeText && data.envelope_msg) envelopeText.innerHTML = `${data.envelope_msg}<br><br>Hope you like this little surprise!`;
                
                const finalMsg = document.getElementById('final-message');
                if (finalMsg && data.main_wish) finalMsg.innerHTML = data.main_wish.replace(/\n/g, '<br>'); 
                
                const payBtn = document.getElementById('pay-now-btn');
                if (payBtn) payBtn.style.display = 'none';
                
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
                if (orderForm) orderForm.style.display = 'block';
            }
        } catch (error) {
            console.error("Failed to load gift data:", error);
            alert("Error loading the surprise. Please refresh the page.");
            if (orderForm) orderForm.style.display = 'block';
        } finally {
            if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600); }
        }
    } else {
        if (preloader) { preloader.style.opacity = '0'; setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600); }
    }
});
