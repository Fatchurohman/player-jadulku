// Data playlist JSON (contoh struktur data)
const playlistData = [
  {
    id: 1,
    title: "Laila Majnun",
    artist: "fatur-music",
    cover: "https://via.placeholder.com/300/1f242d/ffffff?text=Laila+Majnun",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: 2,
    title: "Hoax",
    artist: "fatur-music",
    cover: "https://via.placeholder.com/300/1f242d/ffffff?text=Hoax",
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  }
];

class AudioPlayer {
  constructor(tracks) {
    // Validasi & Parsing Data JSON/Array
    this.playlist = this.parsePlaylist(tracks);
    this.currentIndex = 0;
    this.isPlaying = false;
    this.isShuffle = false;
    this.isRepeat = false;

    // Instance Audio Element
    this.audio = new Audio();

    // DOM Elements
    this.playerWrapper = document.getElementById('playerApp');
    this.playBtn = document.getElementById('playBtn');
    this.playIcon = document.getElementById('playIcon');
    this.prevBtn = document.getElementById('prevBtn');
    this.nextBtn = document.getElementById('nextBtn');
    this.shuffleBtn = document.getElementById('shuffleBtn');
    this.repeatBtn = document.getElementById('repeatBtn');
    
    this.trackTitle = document.getElementById('trackTitle');
    this.trackArtist = document.getElementById('trackArtist');
    this.albumArt = document.getElementById('albumArt');
    
    this.progressBar = document.getElementById('progressBar');
    this.progressFill = document.getElementById('progressFill');
    this.currentTimeEl = document.getElementById('currentTime');
    this.durationTimeEl = document.getElementById('durationTime');

    this.init();
  }

  // Safe JSON/Array Parser
  parsePlaylist(data) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Data playlist tidak valid atau kosong.');
      }
      return parsed.map(track => ({
        id: track?.id ?? Date.now(),
        title: track?.title || 'Unknown Title',
        artist: track?.artist || 'Unknown Artist',
        cover: track?.cover || 'https://via.placeholder.com/300/1f242d/ffffff?text=No+Cover',
        src: track?.src || ''
      }));
    } catch (error) {
      console.error('Error parsing playlist:', error.message);
      return [];
    }
  }

  init() {
    if (this.playlist.length === 0) return;

    this.loadTrack(this.currentIndex);
    this.bindEvents();
  }

  loadTrack(index) {
    const track = this.playlist[index];
    if (!track) return;

    this.trackTitle.textContent = track.title;
    this.trackArtist.textContent = track.artist;
    this.albumArt.src = track.cover;
    this.audio.src = track.src;

    this.progressFill.style.width = '0%';
    this.currentTimeEl.textContent = '0:00';
    this.durationTimeEl.textContent = '0:00';
  }

  bindEvents() {
    // Play / Pause Toggle
    this.playBtn.addEventListener('click', () => this.togglePlay());

    // Next & Prev
    this.nextBtn.addEventListener('click', () => this.nextTrack());
    this.prevBtn.addEventListener('click', () => this.prevTrack());

    // Shuffle & Repeat Toggles
    this.shuffleBtn.addEventListener('click', () => {
      this.isShuffle = !this.isShuffle;
      this.shuffleBtn.style.opacity = this.isShuffle ? '1' : '0.5';
    });

    this.repeatBtn.addEventListener('click', () => {
      this.isRepeat = !this.isRepeat;
      this.repeatBtn.style.opacity = this.isRepeat ? '1' : '0.5';
    });

    // Audio Event Listeners
    this.audio.addEventListener('loadedmetadata', () => {
      this.durationTimeEl.textContent = this.formatTime(this.audio.duration);
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio.duration) {
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.progressFill.style.width = `${percent}%`;
        this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
      }
    });

    this.audio.addEventListener('ended', () => {
      if (this.isRepeat) {
        this.audio.currentTime = 0;
        this.play();
      } else {
        this.nextTrack();
      }
    });

    // Progress Bar Click Seek
    this.progressBar.addEventListener('click', (e) => {
      const rect = this.progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      if (this.audio.duration) {
        this.audio.currentTime = (clickX / width) * this.audio.duration;
      }
    });
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (!this.audio.src) return;
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.playerWrapper.classList.add('playing');
      // SVG Pause Icon
      this.playIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
    }).catch(err => console.error('Playback error:', err));
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playerWrapper.classList.remove('playing');
    // SVG Play Icon
    this.playIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
  }

  nextTrack() {
    if (this.isShuffle) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }
    this.loadTrack(this.currentIndex);
    if (this.isPlaying) this.play();
  }

  prevTrack() {
    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.loadTrack(this.currentIndex);
    if (this.isPlaying) this.play();
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  new AudioPlayer(playlistData);
});
