// script.js - Diperbarui dengan fungsionalitas Tombol Folder
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Elemen DOM dengan Validasi Null/Undefined
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    
    // Menangkap elemen tombol folder (baik yang di transport bawah maupun knob kanan)
    const folderTransportBtn = document.querySelector('.transport-btn:nth-child(6)') || document.getElementById('folder-btn');
    const folderKnob = document.querySelector('.knob[data-function="folder"]');
    
    const canvasContainer = document.getElementById('visualizer-canvas-container');
    const playlistItems = document.querySelectorAll('#playlist-items li');
    const playlistContainer = document.querySelector('.playlist-card');

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
            url: [
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
            ][index % 3] 
        }));
    } catch (error) {
        console.error("Gagal memparsing playlist:", error);
        playlist = [];
    }

    let currentIndex = 0;
    let isPlaying = false;
    let animationId = null;

    // 4. Web Audio API & Audio Element Setup
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
        playlistItems.forEach((li, idx) => {
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

    // 5. Fungsi Render Visualizer
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

    // 6. Handler Aksi Tombol Folder (Simulasi Ganti / Muat Direktori Playlist)
    function handleFolderAction() {
        try {
            console.log("Tombol FOLDER ditekan: Memuat direktori playlist baru...");
            
            // Efek visual sementara pada kartu playlist
            if (playlistContainer) {
                playlistContainer.style.borderColor = '#00ffcc';
                setTimeout(() => {
                    playlistContainer.style.borderColor = '#555';
                }, 500);
            }

            // Contoh rotasi track playlist atau memuat folder lain
            alert("Mode Folder: Menampilkan daftar lagu aktif di Player Jadulku.");
        } catch (e) {
            console.error("Gagal menjalankan aksi folder:", e);
        }
    }

    // Pasang Event Listener ke Tombol Folder & Knob Folder
    if (folderTransportBtn) {
        folderTransportBtn.addEventListener('click', handleFolderAction);
    }
    if (folderKnob) {
        folderKnob.addEventListener('click', handleFolderAction);
    }

    // 7. Event Listener Tombol Kontrol Transport Lainnya
    playBtn.addEventListener('click', () => {
        initAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        audioElement.play().then(() => {
            isPlaying = true;
            console.log(`Memutar: ${playlist[currentIndex].title}`);
        }).catch(e => {
            console.error("Gagal memutar audio:", e);
        });
    });

    pauseBtn.addEventListener('click', () => {
        isPlaying = false;
        audioElement.pause();
        console.log("Audio dijeda");
    });

    stopBtn.addEventListener('click', () => {
        isPlaying = false;
        audioElement.pause();
        audioElement.currentTime = 0;
        console.log("Audio dihentikan");
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
        console.log(`Repeat mode: ${audioElement.loop ? 'ON' : 'OFF'}`);
    });

    audioElement.addEventListener('ended', () => {
        if (!audioElement.loop) {
            nextBtn.click();
        }
    });
});
