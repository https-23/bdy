// ==========================================
// 🧠 0. GLOBAL STATE & COMPRESSION ENGINE
// ==========================================
window.magicalState = {
    partnerName: "",
    userName: "",
    envelopeMsg: "",
    mainWish: "",
    audioLink: "",
    images: { 0: null, 1: null, 2: null, 3: null }
};

// Compresses images down to ~35KB WebP Base64 strings to safeguard Firestore limits
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
                
                // 0.55 WebP quality ensures crisp quality at tiny file sizes
                resolve(canvas.toDataURL('image/webp', 0.55));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Extract YouTube Video ID from any link format
function extractYouTubeId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// ==========================================
// 📸 1. PHOTO UPLOAD & PREVIEW LOGIC
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
                        
                        const plusIcon = parentLabel.querySelector('.upload-icon');
                        if (plusIcon) plusIcon.style.display = 'none';
                    }
                } catch (error) {
                    console.error("Compression failed:", error);
                    alert("Unable to process photo. Please choose a different image.");
                }
            }
        });
    });

    // Auto-Generate Wish Button
    const aiBtn = document.getElementById('ai-generate-btn'); 
    const wishTextarea = document.getElementById('main-wish-msg'); 
    if (aiBtn && wishTextarea) {
        aiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            wishTextarea.value = "You turn the most ordinary days into something worth remembering — a random Tuesday feels a little more magical just because you're in it. 💖";
        });
    }

    // ==========================================
    // 🚀 2. PREVIEW ROUTER
    // ==========================================
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            const partnerNameInput = document.getElementById('partner-name-input');
            const partnerName = partnerNameInput ? partnerNameInput.value.trim() : '';

            if (!partnerName) {
                alert("Please enter your partner's name first! ✨");
                return;
            }

            // Lock input into state
            window.magicalState.partnerName = partnerName;
            window.magicalState.userName = document.getElementById('user-name-input')?.value.trim() || "";
            window.magicalState.envelopeMsg = document.getElementById('envelope-msg')?.value.trim() || "";
            window.magicalState.mainWish = document.getElementById('main-wish-msg')?.value.trim() || "";
            window.magicalState.audioLink = document.getElementById('audio-link-input')?.value.trim() || "";

            // Inject preview values
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
            });

            const dummyUser = document.getElementById('dummy-username');
            if (dummyUser) dummyUser.value = partnerName; 

            // Screen Switch
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
    // 💳 3. RAZORPAY TRANSACTION ENGINE
    // ==========================================
    const payBtn = document.getElementById('pay-now-btn');
    if (payBtn) {
        payBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            payBtn.innerText = "Securing Magic...";
            payBtn.disabled = true;

            try {
                const response = await fetch('/api/create-order', { method: 'POST' });
                const order = await response.json();

                if (order.error) throw new Error(order.error);

                const options = {
                    "key": "Rzp_test_TLeNXeVeDyigeU", // Replace with live key in production
                    "amount": "9900",
                    "currency": "INR",
                    "name": "Magical Surprises",
                    "order_id": order.id,
                    "handler": async function (payment_response) {
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
                            if (result.status === "success") {
                                prompt("🎉 Surprise Created Successfully! Copy your shareable link:", result.link);
                                payBtn.innerText = "Link Generated ✔";
                            } else {
                                throw new Error(result.error);
                            }
                        } catch (verificationError) {
                            console.error("Backend Error:", verificationError);
                            alert("Payment verified, but link generation encountered an issue. Contact support with Payment ID: " + payment_response.razorpay_payment_id);
                            payBtn.innerText = "Error - Try Again";
                            payBtn.disabled = false;
                        }
                    },
                    "theme": { "color": "#c0392b" }
                };
                
                const rzp = new Razorpay(options);
                rzp.on('payment.failed', function () {
                    payBtn.innerText = "PAY ₹99 & GET LINK 🔗";
                    payBtn.disabled = false;
                });
                rzp.open();
            } catch (error) {
                console.error("Payment System Error:", error);
                alert("Error: " + error.message);
                payBtn.innerText = "PAY ₹99 & GET LINK 🔗";
                payBtn.disabled = false;
            }
        });
    }
});

// ==========================================
// 🎩 4. INTERACTIVE APPLICATION CONTROLLER
// ==========================================
let typeWriterTriggered = false;

function playPopSound() {
    const pop = document.getElementById("pop-sound");
    if (pop) {
        pop.currentTime = 0;
        pop.play().catch(() => {});
    }
}

function fireConfetti() {
    if (typeof confetti !== "undefined") {
        const duration = 2500;
        const end = Date.now() + duration;

        (function frame() {
            confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ffb6c1', '#c0392b', '#ffffff'] });
            confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ffb6c1', '#c0392b', '#ffffff'] });
            if (Date.now() < end) requestAnimationFrame(frame);
        }());
    }
}

function showScreen(screenId) {
    const allScreens = document.querySelectorAll(".screen");
    allScreens.forEach(screen => {
        screen.classList.remove("active");
        screen.style.display = 'none'; // Clear previous screen displays strictly
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

// 3D Tilt & Unlock Handler
const unlockBtn = document.getElementById('unlock-btn');
if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
        const user = document.getElementById('dummy-username')?.value || "";
        const pass = document.getElementById('dummy-password')?.value || "";

        if (!user.trim() || !pass.trim()) {
            const tiltCard = document.getElementById('tilt-card');
            if (tiltCard) {
                tiltCard.classList.add('shake');
                setTimeout(() => tiltCard.classList.remove('shake'), 500);
            }
            return;
        }

        playPopSound(); 

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
                bgMusic.play().catch(e => console.log("Audio play blocked by browser policy", e)); 
            }
        }
        
        showScreen("screen1");
    });
}

// Navigation Listeners
document.getElementById("yesBtn")?.addEventListener("click", () => { playPopSound(); showScreen("screen2"); });
document.getElementById("noBtn")?.addEventListener("click", () => { playPopSound(); showScreen("angry"); });
document.getElementById("tryAgain")?.addEventListener("click", () => { playPopSound(); showScreen("screen1"); });

document.getElementById("screen2")?.addEventListener("click", (e) => {
    if (!e.target.classList.contains("backBtn")) { playPopSound(); showScreen("screen3"); }
});

const nextMap = {
    "#screen3 .heartNext": "screen4", 
    "#screen5 .heartNext": "screen6",
    "#screen6 .heartNext": "screen7", 
    "#screen7 .heartNext": "screen8"
};

Object.keys(nextMap).forEach(selector => {
    document.querySelector(selector)?.addEventListener("click", () => { 
        playPopSound(); 
        showScreen(nextMap[selector]); 
    });
});

document.querySelectorAll(".backBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.stopPropagation(); 
        playPopSound(); 
        showScreen(btn.getAttribute("data-back"));
    });
});

// Envelope Controller
const envelopeWrapper = document.getElementById("envelope-wrapper");
if (envelopeWrapper) {
    envelopeWrapper.addEventListener("click", () => {
        if (!envelopeWrapper.classList.contains("open")) { playPopSound(); fireConfetti(); }
        envelopeWrapper.classList.add("open");
        const clickHint = document.querySelector(".click-hint");
        if (clickHint) clickHint.style.display = "none"; 
        setTimeout(() => {
            const btn = document.getElementById("envelopeNextBtn");
            if (btn) btn.style.display = "inline-block";
        }, 1000);
    });
}
document.getElementById("envelopeNextBtn")?.addEventListener("click", () => { playPopSound(); showScreen("screen5"); });

// Typewriter Controller
function triggerTypewriter() {
    const pElement = document.getElementById("final-message");
    if (!pElement) return;
    const text = pElement.innerHTML.replace(/<br\s*\/?>/gi, '\n').trim(); 
    pElement.innerHTML = "";
    let i = 0;
    function typing() {
        if (i < text.length) {
            const char = text.charAt(i);
            pElement.innerHTML += (char === '\n') ? "<br>" : char;
            i++;
            setTimeout(typing, 30);
        } else {
            const secretName = document.getElementById("secret-name");
            if (secretName) secretName.classList.add("show-name");
        }
    }
    typing();
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
    
    if (giftId) {
        if (orderForm) orderForm.style.display = 'none';
        
        try {
            const response = await fetch(`/api/get-gift/${giftId}`);
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            
            const result = await response.json();
            
            if (result.status === 'success') {
                const data = result.data;
                
                const secretNameEl = document.getElementById('secret-name');
                if (secretNameEl) secretNameEl.innerText = `For ${data.partner_name} 💖`;
                
                const dummyUser = document.getElementById('dummy-username');
                if (dummyUser) dummyUser.value = data.partner_name;
                
                const envelopeText = document.querySelector('.letter p');
                if (envelopeText && data.envelope_msg) {
                    envelopeText.innerHTML = `${data.envelope_msg}<br><br>Hope you like this little surprise!`;
                }
                
                const finalMsg = document.getElementById('final-message');
                if (finalMsg && data.main_wish) {
                    finalMsg.innerHTML = data.main_wish.replace(/\n/g, '<br>'); 
                }
                
                const payBtn = document.getElementById('pay-now-btn');
                if (payBtn) payBtn.style.display = 'none';
                
                if (data.images) {
                    const galleryImgs = document.querySelectorAll('.gallery-img');
                    galleryImgs.forEach((img, index) => {
                        const imgUrl = data.images[index] || data.images[index.toString()];
                        if (imgUrl) img.src = imgUrl;
                    });
                }
                
                if (data.audio_link) {
                    window.magicalState.receiverAudio = data.audio_link;
                }
                
                if (previewContainer) previewContainer.style.display = 'block';
                showScreen("login-screen");
            } else {
                alert("Surprise link not found or expired.");
                if (orderForm) orderForm.style.display = 'block';
            }
        } catch (error) {
            console.error("Payload Fetch Error:", error);
            alert("Error loading surprise. Please refresh.");
            if (orderForm) orderForm.style.display = 'block';
        } finally {
            if (preloader) {
                preloader.style.opacity = '0';
                setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600);
            }
        }
    } else {
        if (preloader) {
            preloader.style.opacity = '0';
            setTimeout(() => { preloader.style.visibility = 'hidden'; }, 600);
        }
    }
});
        
