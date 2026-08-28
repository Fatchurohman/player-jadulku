// script.js - Lengkap dengan Auto-Scale 16:9, Visualizer, & File Picker Lokal HP
document.addEventListener('DOMContentLoaded', () => {

    // 1. Fungsi Auto-Scale agar Radio 16:9 Utuh di HP Landscape
    function resizeRadioContainer() {
        const wrapper = document.querySelector('.radio-scaler-wrapper');
        if (!wrapper) return;

        const baseWidth = 1280;
        const baseHeight = 720;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const scaleX = windowWidth / baseWidth;
        const scaleY = windowHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY);

        wrapper.style.transform = `scale(${scale})`;
    }

    window.addEventListener('resize', resizeRadioContainer);
    resizeRadioContainer();

    // 2. Inisialisasi Elemen Pemutar Audio & Validasi DOM
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const folderBtn = document.getElementById('folder-btn');
    const folderKnob = document.querySelector('.knob[data-function="folder"]');
    
    const canvasContainer = document.getElementById('visualizer-canvas-container');
    const playlistContainer = document.getElementById('playlist-items');
    const playlistCard = document.querySelector('.playlist-card');

    if (!playBtn || !canvasContainer) {
        console.error("Elemen esensial pemutar audio tidak ditemukan di DOM.");
        return;
    }

    // 3. Buat Input File Tersembunyi untuk Ambil Musik dari HP
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // 4. Setup Canvas Visualizer
    const canvas = document.createElement('canvas');
    canvas.width = canvasContainer.clientWidth || 600;
    canvas.height = canvasContainer.clientHeight || 250;
    canvasContainer.appendChild(canvas);
    const canvasCtx = canvas.getContext('2d');

    // 5. Data Playlist Default (JSON Aman & Validasi)
    let playlist = [];
    try {
        const initialItems = document.querySelectorAll('#playlist-items li');
        playlist = Array.from(initialItems).map((item, index) => ({
            id: index + 1,
            title: item ? item.textContent.trim() : `Track ${index + 1}`,
            url: [
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
            ][index % 3] 
        }));
    } catch (error) {
        console.error("Gagal memparsing playlist awal:", error);
        playlist = [];
    }

    let currentIndex = 0;
    let isPlaying = false;
    let animationId = null;

    // 6. Web Audio API & Audio Element
    let audioCtx, analyser, dataArray, sourceNode;
    let audioElement = new Audio();
    audioElement.crossOrigin = "anonymous";

    function loadTrack(index) {
        try {
            if (playlist && playlist[index] && playlist[index].url) {
                audioElement.src = playlist[index].url;
                audioElement.load();
                highlightActivePlaylist(index);
            }
        } catch (e) {
            console.error("Error saat memuat track:", e);
        }
    }

    function highlightActivePlaylist(index) {
        const currentItems = playlistContainer.querySelectorAll('li');
        currentItems.forEach((li, idx) => {
            if (li) {
                li.style.color = (idx === index) ? '#00ffcc' : '#222';
                li.style.fontWeight = (idx === index) ? 'bold' : 'normal';
            }
        });
    }

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

    if (playlist.length > 0) {
        loadTrack(currentIndex);
    }

    // 7. Render Efek Visualizer Real-time
    function drawVisualizer() {
        animationId = requestAnimationFrame(drawVisualizer);

        const width = canvas.width;
        const height = canvas.height;

        canvasCtx.fillStyle = '#111111';
        canvasCtx.fillRect(0, 0, width, height);

        if (analyser && isPlaying && audioCtx && audioCtx.state === 'running') {
            analyser.getByteFrequencyData(dataArray);
        } else {
            for (let i = 0; i < (dataArray ? dataArray.length : 32); i++) {
                if (dataArray) dataArray[i] = Math.floor(Math.random() * 15) + 5;
            }
        }

        const barWidth = (width / (dataArray ? dataArray.length : 32)) * 1.5;
        let x = 0;

        const bufferLen = dataArray ? dataArray.length : 32;
        for (let i = 0; i < bufferLen; i++) {
            const barHeight = (dataArray ? dataArray[i] : 20) * 1.2;

            let red = barHeight + 25;
            let green = 255 - (i * 5);
            let blue = 150;

            canvasCtx.fillStyle = `rgb(${red},${green},${blue})`;
            canvasCtx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

            x += barWidth + 1;
        }
    }

    drawVisualizer();

    // 8. Event Handler untuk Tombol Folder (Buka File HP)
    function handleFolderOpen() {
        try {
            fileInput.click();
        } catch (e) {
            console.error("Gagal membuka file picker:", e);
        }
    }

    if (folderBtn) folderBtn.addEventListener('click', handleFolderOpen);
    if (folderKnob) folderKnob.addEventListener('click', handleFolderOpen);

    fileInput.addEventListener('change', (event) => {
        try {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            playlist = [];
            playlistContainer.innerHTML = '';

            Array.from(files).forEach((file, index) => {
                const fileUrl = URL.createObjectURL(file);
                playlist.push({
                    id: index + 1,
                    title: file.name,
                    url: fileUrl
                });

                const li = document.createElement('li');
                li.textContent = `${index + 1}. ${file.name}`;
                playlistContainer.appendChild(li);
            });

            currentIndex = 0;
            loadTrack(currentIndex);
            if (playlistCard) {
                playlistCard.style.borderColor = '#00ffcc';
                setTimeout(() => playlistCard.style.borderColor = '#555', 600);
            }
            console.log(`Berhasil memuat ${playlist.length} lagu lokal.`);
        } catch (e) {
            console.error("Error memproses file lokal:", e);
        }
    });

    // 9. Event Listener Kontrol Transport Musik
    playBtn.addEventListener('click', () => {
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        audioElement.play().then(() => {
            isPlaying = true;
            console.log(`Memutar: ${playlist[currentIndex] ? playlist[currentIndex].title : ''}`);
        }).catch(e => {
            console.error("Gagal memutar audio:", e);
        });
    });

    pauseBtn.addEventListener('click', () => {
        isPlaying = false;
        audioElement.pause();
    });

    stopBtn.addEventListener('click', () => {
        isPlaying = false;
        audioElement.pause();
        audioElement.currentTime = 0;
    });

    nextBtn.addEventListener('click', () => {
        if (playlist.length > 0) {
            currentIndex = (currentIndex + 1) % playlist.length;
            loadTrack(currentIndex);
            if (isPlaying) audioElement.play();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (playlist.length > 0) {
            currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
            loadTrack(currentIndex);
            if (isPlaying) audioElement.play();
        }
    });

    repeatBtn.addEventListener('click', () => {
        audioElement.loop = !audioElement.loop;
        repeatBtn.style.background = audioElement.loop ? 'linear-gradient(to bottom, #a0ffa0, #50c050)' : '';
    });

    audioElement.addEventListener('ended', () => {
        if (!audioElement.loop) {
            nextBtn.click();
        }
    });
});
