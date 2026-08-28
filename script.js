// script.js - Diperbarui dengan dukungan File Selector (Buka Folder/File dari HP)
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi Elemen DOM dengan Validasi Null/Undefined
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const stopBtn = document.getElementById('stop-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    
    const folderTransportBtn = document.querySelector('.transport-btn:nth-child(6)') || document.getElementById('folder-btn');
    const folderKnob = document.querySelector('.knob[data-function="folder"]');
    
    const canvasContainer = document.getElementById('visualizer-canvas-container');
    const playlistContainer = document.getElementById('playlist-items');
    const playlistCard = document.querySelector('.playlist-card');

    if (!playBtn || !canvasContainer) {
        console.error("Elemen esensial pemutar audio tidak ditemukan di DOM.");
        return;
    }

    // 2. Buat Elemen Input File Tersembunyi untuk Akses Perangkat/HP
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';
    fileInput.multiple = true; // Bisa pilih banyak lagu sekaligus
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // 3. Setup Canvas untuk Audio Visualizer
    const canvas = document.createElement('canvas');
    canvas.width = canvasContainer.clientWidth || 400;
    canvas.height = canvasContainer.clientHeight || 180;
    canvasContainer.appendChild(canvas);
    const canvasCtx = canvas.getContext('2d');

    // 4. Data Playlist Awal (JSON Aman & Validasi)
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

    // 5. Web Audio API & Audio Element Setup
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

    // 6. Fungsi Render Visualizer
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

    // 7. Handler Tombol Folder untuk Membuka Penyimpanan File Lokal HP
    function handleFolderOpen() {
        try {
            fileInput.click(); // Memicu dialog pilih file/folder di perangkat
        } catch (e) {
            console.error("Gagal membuka dialog file:", e);
        }
    }

    if (folderTransportBtn) folderTransportBtn.addEventListener('click', handleFolderOpen);
    if (folderKnob) folderKnob.addEventListener('click', handleFolderOpen);

    // Event saat pengguna selesai memilih file dari HP
    fileInput.addEventListener('change', (event) => {
        try {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            // Reset playlist dengan file lokal yang dipilih
            playlist = [];
            playlistContainer.innerHTML = '';

            Array.from(files).forEach((file, index) => {
                const fileUrl = URL.createObjectURL(file);
                playlist.push({
                    id: index + 1,
                    title: file.name,
                    url: fileUrl
                });

                // Tambahkan ke tampilan UI Playlist Card
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
            console.log(`Berhasil memuat ${playlist.length} lagu dari perangkat.`);
        } catch (e) {
            console.error("Error memproses file lokal:", e);
        }
    });

    // 8. Event Listener Tombol Kontrol Transport Lainnya
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
