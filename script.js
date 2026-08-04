    // ==========================================
    // 🧠 0. GLOBAL STATE & COMPRESSION ENGINE
    // ==========================================
    window.magicalState = {
        partnerName: "",
        userName: "",
        envelopeMsg: "",
        mainWish: "",
        audioLink: "",
        images: { 0: null, 1: null, 2: null, 3: null } // Holds Base64 strings
    };

    // Compresses images down to ~150KB WebP Base64 strings
    async function compressImage(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        try {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 1080;
                            const MAX_HEIGHT = 1350;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                                if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                }
                            } else {
                                if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            // 0.7 quality WebP is optimal for mobile loading speeds
                            resolve(canvas.toDataURL('image/webp', 0.7)); 
                        } catch (err) {
                            reject(err);
                        }
                    };
                    img.onerror = (err) => reject(err);
                };
                reader.onerror = (err) => reject(err);
            } catch (err) {
                reject(err);
            }
        });
    }

    // ==========================================
    // 📸 1. PHOTO UPLOAD & PREVIEW LOGIC
    // ==========================================
    try {
        const photoInputs = document.querySelectorAll('.photo-upload-box input[type="file"]');
        photoInputs.forEach((input, index) => {
            input.addEventListener('change', async function(e) {
                const file = e.target.files[0];
                if(file) {
                    try {
                        const base64Data = await compressImage(file);
                        window.magicalState.images[index] = base64Data;

                        const parentLabel = input.parentElement;
                        if(parentLabel) {
                            parentLabel.style.backgroundImage = `url('${base64Data}')`;
                            parentLabel.style.backgroundSize = 'cover';
                            parentLabel.style.backgroundPosition = 'center';
                            parentLabel.style.border = 'none'; 
                            
                            const plusIcon = parentLabel.querySelector('.upload-icon') || parentLabel.querySelector('span');
                            if(plusIcon) plusIcon.style.display = 'none';
                        }
                    } catch (error) {
                        console.error("Compression failed:", error);
                        alert("Could not process this image. Please try a different one.");
                    }
                }
            });
        });
    } catch (err) {
        console.error("Photo upload error:", err);
    }

    // ==========================================
    // ✨ 2. AUTO-GENERATE WISH LOGIC
    // ==========================================
    try {
        const allButtons = document.querySelectorAll('button');
        const wishTextarea = document.querySelector('textarea'); 
        allButtons.forEach(btn => {
            if(btn.innerText && btn.innerText.includes("Auto-Generate")) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if(wishTextarea) {
                        wishTextarea.value = "You turn the most ordinary days into something worth remembering — a random Tuesday feels a little more magical just because you're in it. 💖";
                    }
                });
            }
        });
    } catch (err) {
        console.error("Auto-wish error:", err);
    }

    // ==========================================
    // 🚀 3. PREVIEW BUTTON & STATE CAPTURE
    // ==========================================
    try {
        const previewBtn = document.getElementById('preview-btn');
        if(previewBtn) {
            previewBtn.addEventListener('click', () => {
                const partnerNameInput = document.getElementById('partner-name-input');
                const partnerName = partnerNameInput ? partnerNameInput.value.trim() : '';

                if(partnerName === '') {
                    alert("Please enter the name first! ✨");
                    return;
                }

                // Lock form data into Global State
                window.magicalState.partnerName = partnerName;
                window.magicalState.userName = document.getElementById('user-name-input')?.value.trim() || "";
                window.magicalState.envelopeMsg = document.getElementById('envelope-msg')?.value.trim() || "";
                window.magicalState.mainWish = document.getElementById('main-wish-msg')?.value.trim() || "";
                window.magicalState.audioLink = document.getElementById('audio-link-input')?.value.trim() || "";

                const secretNameEl = document.getElementById('secret-name');
                if(secretNameEl) secretNameEl.innerText = `For ${partnerName} 💖`;
                
                const dummyUser = document.getElementById('dummy-username');
                if(dummyUser) dummyUser.value = partnerName; 

                const orderForm = document.getElementById('order-form-container');
                if(orderForm) orderForm.style.display = "none";

                const previewContainer = document.getElementById('preview-container');
                if(previewContainer) previewContainer.style.display = "block"; 

                const loginScreen = document.getElementById('login-screen');
                if(loginScreen) {
                    loginScreen.style.display = 'flex';
                    loginScreen.classList.add('active');
                }

                window.scrollTo(0, 0);

                const preloader = document.getElementById('preloader');
                if (preloader) {
                    preloader.style.opacity = '0';
                    setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600);
                }
            });
        }
    } catch (err) {
        console.error("Preview button error:", err);
    }
        
    // ==========================================
    // 💳 4. RAZORPAY ATOMIC TRANSACTION 
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
                    "key": "rzp_test_TKTfMVdW3E31VL", 
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
                                    images: window.magicalState.images
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
                console.error(error);
                alert("Error connecting to server. Please try again.");
                payBtn.innerText = "Pay Now (₹99)";
                payBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 🎩 PHASE 3: ORIGINAL MAGICAL APP LOGIC
    // ==========================================
    const screens = document.querySelectorAll(".screen");
    let typeWriterTriggered = false;

    // AUDIO ENGINE
    function playPopSound() {
        const pop = document.getElementById("pop-sound");
        if (pop) {
            pop.currentTime = 0;
            pop.play().catch(e => {});
        }
    }

    // CONFETTI ENGINE
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
        screens.forEach(screen => screen.classList.remove("active"));
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) targetScreen.classList.add("active");

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
    // --- 3D LOGIN SCREEN LOGIC & CUSTOM AUDIO ROUTER ---
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
                // --- CUSTOM AUDIO ROUTER ---
                const customAudioLink = window.magicalState?.receiverAudio || window.magicalState?.audioLink;
                
                if (customAudioLink && (customAudioLink.includes('youtube.com') || customAudioLink.includes('youtu.be'))) {
                    // Extract Video ID robustly
                    let videoId = '';
                    try {
                        if (customAudioLink.includes('youtu.be/')) {
                            videoId = customAudioLink.split('youtu.be/')[1].split('?')[0];
                        } else if (customAudioLink.includes('v=')) {
                            videoId = customAudioLink.split('v=')[1].split('&')[0];
                        }
                        
                        if (videoId) {
                            // Inject invisible iframe to bypass audio DRM
                            const iframe = document.createElement('iframe');
                            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0`;
                            iframe.style.display = 'none';
                            iframe.allow = 'autoplay';
                            document.body.appendChild(iframe);
                        }
                    } catch(err) {
                        console.error("YouTube parsing failed", err);
                    }
                } else {
                    // Fallback to default music if no custom link or not YouTube
                    const bgMusic = document.getElementById("bg-music");
                    if (bgMusic) { 
                        bgMusic.volume = 0.5; 
                        bgMusic.play().catch(e => console.log("Audio play blocked by browser", e)); 
                    }
                }
                
                showScreen("screen1");
            }, 1500);
        });
    }
    
    // --- BASIC NAVIGATION ---
    document.getElementById("yesBtn")?.addEventListener("click", () => {
        playPopSound(); 
        const bgMusic = document.getElementById("bg-music");
        if (bgMusic) { bgMusic.volume = 0.5; bgMusic.play().catch(e => {}); }
        showScreen("screen2");
    });
    
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
        const text = pElement.innerHTML.replace(/<br>/g, '\n').trim(); 
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

    // --- SCRATCH CARDS ---
    const messages = {
        1: `<strong style="font-size: 1.4rem; color: var(--primary-color);">🎂 Happy Birthday!</strong><br><br><span style="font-size: 1.1rem; color: var(--text-color);">Wishing you a year full of happiness, good health, and countless reasons to smile. Have an amazing birthday!</span>`,
        2: `<strong style="font-size: 1.4rem; color: var(--primary-color);">💛 A Small Apology</strong><br><br><span style="font-size: 1.1rem; color: var(--text-color);">If I ever made you uncomfortable or hurt you in any way, I'm truly sorry. That was never my intention.</span>`,
        3: `<strong style="font-size: 1.4rem; color: var(--primary-color);">💌 Just One Thing</strong><br><br><span style="font-size: 1.1rem; color: var(--text-color);">You don't have to reply. I just hope you read this. That's enough for me.</span>`,
        4: `<strong style="font-size: 1.4rem; color: var(--primary-color);">🌸 Take Care</strong><br><br><span style="font-size: 1.1rem; color: var(--text-color);">No matter what, I genuinely wish the best for you. Stay happy, stay safe, and enjoy your special day.</span>`
    };

    const modal = document.getElementById('scratch-modal');
    const modalContent = document.getElementById('modal-message-content');
    const scratchCanvas = document.getElementById('popup-scratch-pad');
    const scratchSound = document.getElementById('scratch-sound');
    
    document.querySelectorAll('.mini-card').forEach(card => {
        card.addEventListener('click', () => {
            playPopSound();
            if(modalContent) modalContent.innerHTML = messages[card.getAttribute('data-id')];
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
                    if (scratchSound) { 
                        scratchSound.currentTime = 0; 
                        scratchSound.play().catch(e => {}); 
                    }
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
        targetX = x; 
        targetY = y;
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

});
