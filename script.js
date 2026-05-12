// Sound Generator using Web Audio API
class SoundAlert {
    constructor() {
        this.audioCtx = null;
        this.isPlaying = false;
        this.interval = null;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playBeep() {
        if (!this.audioCtx) return;
        
        const osc = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, this.audioCtx.currentTime); // 800Hz beep
        osc.frequency.exponentialRampToValueAtTime(400, this.audioCtx.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, this.audioCtx.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.3);
        
        osc.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.3);
    }

    startAlert() {
        this.init();
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.playBeep();
        this.interval = setInterval(() => {
            this.playBeep();
        }, 1000);
    }

    stopAlert() {
        if (!this.isPlaying) return;
        clearInterval(this.interval);
        this.isPlaying = false;
    }
}

const alertSystem = new SoundAlert();

// State
const state = {
    dailyRevenue: 0,
    totalRunTimeMs: 0,
    consoles: [
        { id: 1, name: 'PS1', tier: 'Premium', session: null },
        { id: 2, name: 'PS2', tier: 'Standard', session: null },
        { id: 3, name: 'PS3', tier: 'Standard', session: null },
        { id: 4, name: 'PS4', tier: 'Standard', session: null },
        { id: 5, name: 'PS5', tier: 'Standard', session: null },
        { id: 6, name: 'PS6', tier: 'Standard', session: null },
        { id: 7, name: 'PS7', tier: 'Standard', session: null }
    ]
};

// Pricing Logic
function calculatePrice(tier, minutes) {
    if (tier === 'Premium') {
        if (minutes === 10) return 50;
        if (minutes === 30) return 100;
        if (minutes === 60) return 200;
        return Math.round((200 / 60) * minutes);
    } else {
        if (minutes === 10) return 30;
        if (minutes === 30) return 50;
        if (minutes === 60) return 100;
        return Math.round((100 / 60) * minutes);
    }
}

// Master Dashboard Updates
function updateClock() {
    const now = new Date();
    const timeString = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    }).format(now);
    document.getElementById('clock').textContent = timeString;
}
setInterval(updateClock, 1000);
updateClock();

function updateMasterStats() {
    document.getElementById('daily-revenue').textContent = state.dailyRevenue;
    
    const totalMinutes = Math.floor(state.totalRunTimeMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    document.getElementById('total-run-time').textContent = `${hours}h ${minutes}m`;
}

// Format helpers
function formatTimeDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(date);
}

function formatDuration(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// UI Generation
function renderConsoles() {
    const grid = document.getElementById('console-grid');
    grid.innerHTML = '';
    
    state.consoles.forEach(console => {
        const card = document.createElement('div');
        card.className = `console-card ${console.session ? 'active' : ''} ${console.session?.isFlashing ? 'flashing' : ''}`;
        card.id = `console-${console.id}`;
        
        let sessionHtml = '';
        if (console.session) {
            sessionHtml = `
                <div class="info-row"><span>Start:</span> <span>${formatTimeDate(new Date(console.session.startTime))}</span></div>
                <div class="info-row"><span>End:</span> <span>${formatTimeDate(new Date(console.session.endTime))}</span></div>
                <div class="info-row"><span>Price:</span> <span>${console.session.price} BDT</span></div>
                <div class="timer-display" id="timer-${console.id}">00:00:00</div>
            `;
        } else {
            sessionHtml = `
                <div class="info-row" style="opacity:0.3"><span>Ready</span></div>
                <div class="timer-display" style="opacity:0.1">00:00:00</div>
            `;
        }
        
        card.innerHTML = `
            <div class="console-header">
                <h2>${console.name}</h2>
                <span class="tier-badge">${console.tier}</span>
            </div>
            <div class="console-body">
                <div class="session-info">
                    ${sessionHtml}
                </div>
                <div class="controls">
                    <button onclick="startSession(${console.id}, 10)">10m</button>
                    <button onclick="startSession(${console.id}, 30)">30m</button>
                    <button onclick="startSession(${console.id}, 60)">60m</button>
                    <button onclick="startSession(${console.id}, 90)">90m</button>
                    <button onclick="startSession(${console.id}, 120)">120m</button>
                </div>
                <button class="btn-end" onclick="endSession(${console.id})">End / Clear Session</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function startSession(id, minutes) {
    alertSystem.init(); // Initialize audio context on user interaction
    if (alertSystem.audioCtx.state === 'suspended') {
        alertSystem.audioCtx.resume();
    }
    
    const consoleObj = state.consoles.find(c => c.id === id);
    const now = Date.now();
    const durationMs = minutes * 60 * 1000;
    
    consoleObj.session = {
        startTime: now,
        endTime: now + durationMs,
        durationMs: durationMs,
        price: calculatePrice(consoleObj.tier, minutes),
        isFlashing: false,
        timerInterval: null
    };
    
    consoleObj.session.timerInterval = setInterval(() => updateTimer(id), 1000);
    renderConsoles();
    updateTimer(id);
}

function endSession(id) {
    const consoleObj = state.consoles.find(c => c.id === id);
    if (!consoleObj.session) return;
    
    // Add to master stats
    state.dailyRevenue += consoleObj.session.price;
    
    // Calculate actual elapsed time to add to total run time
    const now = Date.now();
    const elapsedMs = Math.min(now - consoleObj.session.startTime, consoleObj.session.durationMs);
    state.totalRunTimeMs += elapsedMs;
    
    clearInterval(consoleObj.session.timerInterval);
    
    // Check if we need to stop the global alert
    consoleObj.session = null;
    checkGlobalAlert();
    
    updateMasterStats();
    renderConsoles();
}

function updateTimer(id) {
    const consoleObj = state.consoles.find(c => c.id === id);
    if (!consoleObj.session) return;
    
    const now = Date.now();
    const remainingMs = consoleObj.session.endTime - now;
    
    const timerDisplay = document.getElementById(`timer-${id}`);
    if (timerDisplay) {
        timerDisplay.textContent = formatDuration(remainingMs);
    }
    
    if (remainingMs <= 0) {
        if (!consoleObj.session.isFlashing) {
            consoleObj.session.isFlashing = true;
            renderConsoles(); // Re-render to add flashing class
            checkGlobalAlert();
        }
    }
}

function checkGlobalAlert() {
    const anyFlashing = state.consoles.some(c => c.session && c.session.isFlashing);
    if (anyFlashing) {
        alertSystem.startAlert();
    } else {
        alertSystem.stopAlert();
    }
}

// Initial render
renderConsoles();
