// script.js - Logika Pemutar Musik, Web Audio API, & Visualizer
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Elemen DOM dengan Validasi Null/Undefined
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const canvasContainer = document.getElementById('visualizer-canvas-container');
    const playlistItems = document.querySelectorAll('#playlist-items li');

    if (!playBtn || !canvasContainer) {
        console.error("Elemen esensial pemutar audio tidak ditemukan di DOM.");
        return;
    }

    // 2. Setup Canvas untuk Audio Visualizer
    const canvas = document.createElement('canvas');
    canvas.width = canvasContainer.clientWidth || 400;
    canvas.height = canvasContainer.clientHeight || 180;
    canvasContainer.appendChild(canvas);
    const canvasCtx = canvas.getContext('2d');

    // 3. Simulasi Playlist Data (JSON Aman & Validasi Tipe Data)
    let playlist = [];
    try {
        playlist = Array.from(playlistItems).map((item, index) => ({
            id: index + 1,
            title: item ? item.textContent.trim() : `Track ${index + 1}`,
            url: '' // Diisi path audio lokal/streaming jika ada
        }));
    } catch (error) {
        console.error("Gagal memparsing playlist:", error);
        playlist = [];
    }

    let currentIndex = 0;
    let isPlaying = false;
    let animationId = null;

    // 4. Web Audio API Setup untuk Efek Visualizer Real-time
    let audioCtx, analyser, dataArray, sourceNode;
    let audioElement = new Audio();

    function initAudioContext() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                
                sourceNode = audioCtx.createMediaElementSource(audioElement);
                sourceNode.connect(analyser);
                analyser.connect(audioCtx.destination);
                
                dataArray = new Uint8Array(analyser.frequencyBinCount);
            } catch (e) {
                console.warn("Web Audio API tidak didukung penuh:", e);
            }
        }
    }

    // 5. Fungsi Render Visualizer (Efek Spektrum Warna Warni di Layar)
    function drawVisualizer() {
        animationId = requestAnimationFrame(drawVisualizer);

        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.fillStyle = '#111111';
        canvasCtx.fillRect(0, 0, width, height);

        if (analyser && isPlaying) {
            analyser.getByteFrequencyData(dataArray);
        } else {
            // Animasi dummy statis/aktif saat audio berhenti agar layar tetap hidup
            for (let i = 0; i < (dataArray ? dataArray.length : 32); i++) {
                if (dataArray) dataArray[i] = Math.floor(Math.random() * 40) + 10;
            }
        }

        const barWidth = (width / (dataArray ? dataArray.length : 32)) * 1.5;
        let x = 0;

        const bufferLen = dataArray ? dataArray.length : 32;
        for (let i = 0; i < bufferLen; i++) {
            const barHeight = (dataArray ? dataArray[i] : 20) * 1.2;

            // Gradasi warna ala retro equalizer
            let red = barHeight + 25;
            let green = 255 - (i * 5);
            let blue = 150;

            canvasCtx.fillStyle = `rgb(${red},${green},${blue})`;
            canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

            x += barWidth + 1;
        }
    }

    // Jalankan loop visualizer
    drawVisualizer();

    // 6. Event Listener Tombol Kontrol Transport
    playBtn.addEventListener('click', () => {
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        isPlaying = true;
        console.log(`Memutar: ${playlist[currentIndex] ? playlist[currentIndex].title : 'Audio'}`);
        // audioElement.play().catch(e => console.log("File audio belum di-set:", e));
    });

    pauseBtn.addEventListener('click', () => {
        isPlaying = false;
        audioElement.pause();
        console.log("Audio dijeda (Paused)");
    });

    stopBtn.addEventListener('click', () => {
        isPlaying = false;
        audioElement.pause();
        audioElement.currentTime = 0;
        console.log("Audio dihentikan (Stopped)");
    });

    nextBtn.addEventListener('click', () => {
        if (playlist.length > 0) {
            currentIndex = (currentIndex + 1) % playlist.length;
            console.log(`Track selanjutnya: ${playlist[currentIndex].title}`);
        }
    });

    prevBtn.addEventListener('click', () => {
        if (playlist.length > 0) {
            currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            console.log(`Track sebelumnya: ${playlist[currentIndex].title}`);
        }
    });

    repeatBtn.addEventListener('click', () => {
        audioElement.loop = !audioElement.loop;
        console.log(`Repeat mode: ${audioElement.loop ? 'ON' : 'OFF'}`);
    });

});
