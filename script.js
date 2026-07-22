document.addEventListener("DOMContentLoaded", () => {    
    // --- PRELOADER LOGIC ---
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.visibility = 'hidden';
                }, 600); 
            }, 800); 
        }
    });

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

    // --- 3D LOGIN SCREEN LOGIC ---
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

    unlockBtn?.addEventListener('click', () => {
        const user = document.getElementById('dummy-username').value;
        const pass = document.getElementById('dummy-password').value;

        if(user.trim() === '' || pass.trim() === '') {
            tiltCard.classList.add('shake');
            setTimeout(() => tiltCard.classList.remove('shake'), 500);
            return;
        }

        // Processing state
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        playPopSound(); 

        setTimeout(() => {
            const bgMusic = document.getElementById("bg-music");
            if (bgMusic) { 
                bgMusic.volume = 0.5; 
                bgMusic.play().catch(e => console.log("Audio play blocked", e)); 
            }
            showScreen("screen1");
        }, 1500);
    });

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

    // --- SCRATCH CARDS (Memory Leak Fixed) ---
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
            modalContent.innerHTML = messages[card.getAttribute('data-id')];
            modal.classList.add('show');
            setTimeout(initPopupScratchCard, 300);
        });
    });

    document.getElementById('close-modal')?.addEventListener('click', () => { playPopSound(); modal.classList.remove('show'); });

    let isDrawing = false; 
    let lastAudioTime = 0; 
    let scratchEventsBound = false; 

    function initPopupScratchCard() {
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

    // --- PARALLAX & SENSOR OPTIMIZATION (Throttled) ---
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
                    if(img) {
                        modalImage.src = img.src;
                        photoModal.classList.add('show');
                    }
                }, 300); 
            }
            lastTap = currentTime;
        });
    });

    closePhotoModalBtn?.addEventListener('click', () => {
        playPopSound();
        photoModal.classList.remove('show');
    });

});
                    
