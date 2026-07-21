document.addEventListener("DOMContentLoaded", () => {    
        // --- PRELOADER LOGIC ---
    window.addEventListener('load', () => {
        const preloader = document.getElementById('preloader');
        if (preloader) {
            // Thoda delay taaki smooth transition ho
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.visibility = 'hidden';
                }, 600); // Wait for fade out animation
            }, 800); 
        }
    });

    const screens = document.querySelectorAll(".screen");
    let typeWriterTriggered = false;

    // AUDIO HAPTIC ENGINE
    function playPopSound() {
        const pop = document.getElementById("pop-sound");
        if (pop) {
            pop.currentTime = 0;
            pop.play().catch(e => {});
        }
    }

    // CONFETTI CANNON
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

    // --- TYPEWRITER & SECRET NAME REVEAL ---
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
                // Typing khatam hone ke baad Secret Name Glow karega!
                const secretName = document.getElementById("secret-name");
                if (secretName) {
                    secretName.classList.add("show-name");
                }
            }
        }
        typing();
    }

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

    function initPopupScratchCard() {
        const ctx = scratchCanvas.getContext('2d');
        const rect = scratchCanvas.parentElement.getBoundingClientRect();
        scratchCanvas.width = rect.width; scratchCanvas.height = rect.height;

        ctx.fillStyle = '#b3b3b3'; ctx.fillRect(0, 0, scratchCanvas.width, scratchCanvas.height);
        ctx.font = "bold 24px 'Fredoka', sans-serif"; ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Scratch Me! ✨", scratchCanvas.width / 2, scratchCanvas.height / 2);

        let isDrawing = false; let lastAudioTime = 0; 

        function scratch(e) {
            if (!isDrawing) return;
            e.preventDefault();
            const canvasRect = scratchCanvas.getBoundingClientRect();
            let x = (e.touches ? e.touches[0].clientX : e.clientX) - canvasRect.left;
            let y = (e.touches ? e.touches[0].clientY : e.clientY) - canvasRect.top;

            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI * 2); ctx.fill();

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
    }

    let targetX = 0, targetY = 0; let currentX = 0, currentY = 0;

    window.addEventListener("deviceorientation", (e) => {
        if (!e.gamma || !e.beta) return;
        let tiltX = e.gamma; let tiltY = e.beta;  
        if (tiltX > 25) tiltX = 25; if (tiltX < -25) tiltX = -25;
        if (tiltY > 55) tiltY = 55; if (tiltY < 25) tiltY = 25; 
        targetX = (tiltX / 25) * 15; targetY = ((tiltY - 40) / 15) * 15; 
    });

    document.addEventListener("mousemove", (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 30; 
        const y = (e.clientY / window.innerHeight - 0.5) * 30;
        targetX = x; targetY = y;
    });

    function renderParallax() {
        currentX += (targetX - currentX) * 0.1; currentY += (targetY - currentY) * 0.1;
        document.querySelectorAll(".character, .glass, .envelope-wrapper, .cake, .flowers").forEach(el => {
            const depth = el.classList.contains('glass') ? 0.4 : 1;
            el.style.transform = `translate(${currentX * depth}px, ${currentY * depth}px)`;
        });
        requestAnimationFrame(renderParallax);
    }
    renderParallax(); 
});
                                                             
