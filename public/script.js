/* script.js */

document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // ===== 1. UI 요소 선택 (DOM Elements) =====
    // =============================================
    const form = document.getElementById('memo-form');
    const input = document.getElementById('memo-input');
    const notesContainer = document.getElementById('notes-container');

    const musicIcon = document.getElementById('dock-music-icon');
    const lyricsIcon = document.getElementById('dock-lyrics-icon');
    const memoIcon = document.getElementById('dock-memo-icon');
    const settingsIcon = document.getElementById('dock-settings-icon');
    const finderIcon = document.getElementById('dock-finder-icon');

    const musicPlayer = document.getElementById('music-player');
    const closeMusicPlayerBtn = musicPlayer.querySelector('.close-btn');

    const audioPlayer = document.getElementById('main-audio');
    const playBtn = document.querySelector('.controls .play');
    const prevBtn = document.querySelector('.controls .prev');
    const nextBtn = document.querySelector('.controls .next');
    
    const progress = document.querySelector('.track .progress');
    const trackContainer = document.querySelector('.track');
    const totalTimeEl = document.querySelector('.time .total-time');
    const currentTimeEl = document.querySelector('.time .last-time');

    const lyricsSidebar = document.getElementById('lyrics-sidebar');
    const closeLyricsSidebarBtn = lyricsSidebar.querySelector('.close-btn');
    const lyricsTextEl = lyricsSidebar.querySelector('.lyrics-text');

    const musicPlayerSubtitleEl = musicPlayer.querySelector('.subtitle');

    const creditsModal = document.getElementById('credits-modal');
    const closeCreditsModalBtn = creditsModal.querySelector('.close-btn');

    const finderModal = document.getElementById('finder-modal');
    const closeFinderModalBtn = finderModal.querySelector('.close-btn');
    
    let isPlaying = false;
    let lyricsLoaded = false;

    // =============================================
    // ===== 2. 이벤트 리스너 (Event Listeners) =====
    // =============================================

    // --- 초기화 ---
    fetchNotes();
    updateTime();
    setInterval(updateTime, 1000);

    // --- 독 아이콘 이벤트 ---
    musicIcon.addEventListener('click', () => {
        lyricsSidebar.classList.remove('visible');
        creditsModal.classList.remove('visible');
        finderModal.classList.remove('visible');
        musicPlayer.classList.toggle('visible');
        if (musicPlayer.classList.contains('visible') && !lyricsLoaded) {
            loadLyrics();
        }
    });

    lyricsIcon.addEventListener('click', () => {
        musicPlayer.classList.remove('visible');
        creditsModal.classList.remove('visible');
        finderModal.classList.remove('visible');
        lyricsSidebar.classList.toggle('visible');
        if (lyricsSidebar.classList.contains('visible') && !lyricsLoaded) {
            loadLyrics();
        }
    });
    
    settingsIcon.addEventListener('click', () => {
        musicPlayer.classList.remove('visible');
        lyricsSidebar.classList.remove('visible');
        finderModal.classList.remove('visible');
        creditsModal.classList.add('visible');
    });

    finderIcon.addEventListener('click', () => {
        musicPlayer.classList.remove('visible');
        lyricsSidebar.classList.remove('visible');
        creditsModal.classList.remove('visible');
        finderModal.classList.add('visible');
    });

    memoIcon.addEventListener('click', () => {
        musicPlayer.classList.remove('visible');
        lyricsSidebar.classList.remove('visible');
        creditsModal.classList.remove('visible');
        finderModal.classList.remove('visible');
    });

    // --- 닫기 버튼 이벤트 ---
    closeMusicPlayerBtn.addEventListener('click', () => musicPlayer.classList.remove('visible'));
    closeLyricsSidebarBtn.addEventListener('click', () => lyricsSidebar.classList.remove('visible'));
    closeCreditsModalBtn.addEventListener('click', () => creditsModal.classList.remove('visible'));
    closeFinderModalBtn.addEventListener('click', () => finderModal.classList.remove('visible'));

    // --- 모달 외부 클릭 시 닫기 이벤트 ---
    creditsModal.addEventListener('click', (e) => {
        if (e.target === creditsModal) { creditsModal.classList.remove('visible'); }
    });
    finderModal.addEventListener('click', (e) => {
        if (e.target === finderModal) { finderModal.classList.remove('visible'); }
    });

    // --- 메모 입력 폼 제출 ---
    form.addEventListener('submit', handleFormSubmit);

    // --- 음악 재생 컨트롤 ---
    playBtn.addEventListener('click', togglePlayPause);
    audioPlayer.addEventListener('timeupdate', updateProgressBar);
    audioPlayer.addEventListener('loadedmetadata', setTotalTime);
    audioPlayer.addEventListener('ended', pauseMusic);
    trackContainer.addEventListener('click', setProgress);

    // ========================================
    // ===== 3. 함수 (Functions) =====
    // ========================================

    async function handleFormSubmit(e) {
        e.preventDefault();
        const content = input.value.trim();
        if (content) {
            const newNote = await saveNote(content);
            input.value = '';
            if (newNote) {
                const newNoteElement = createNoteElement(newNote, true);
                newNoteElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                if (notesContainer.children.length > 999) {
                    notesContainer.firstChild.remove();
                }
            }
        }
    }

    async function fetchNotes() {
        try {
            const response = await fetch('/api/notes');
            const notes = await response.json();
            notesContainer.innerHTML = '';
            notes.reverse().forEach(note => createNoteElement(note, false));
        } catch (error) { console.error('메모를 불러오는 중 오류가 발생했습니다:', error); }
    }

    async function saveNote(content) {
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            return await response.json();
        } catch (error) { console.error('메모를 저장하는 중 오류가 발생했습니다:', error); }
    }

    function createNoteElement(note, shouldAnimate = false) {
        const noteWindow = document.createElement('div');
        noteWindow.classList.add('note-window');
        if (shouldAnimate) { noteWindow.classList.add('note-hidden'); }
        noteWindow.innerHTML = `<div class="title-bar"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><div class="content">${note.content}</div>`;
        
        noteWindow.querySelector('.dot.red').addEventListener('click', (e) => {
            e.stopPropagation();
            if (noteWindow.classList.contains('note-window-enlarged')) {
                noteWindow.classList.remove('note-window-enlarged');
                toggleOverlay();
            } else {
                deleteNote(note.id, noteWindow);
            }
        });
    
        noteWindow.querySelector('.dot.green').addEventListener('click', (e) => {
            e.stopPropagation();
            noteWindow.classList.toggle('note-window-enlarged');
            toggleOverlay();
        });
    
        notesContainer.appendChild(noteWindow);
    
        if (shouldAnimate) {
            requestAnimationFrame(() => { noteWindow.classList.remove('note-hidden'); });
        }
        return noteWindow; 
    }

    async function deleteNote(noteId, noteElement) {
        try {
            const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
            if (response.ok) {
                noteElement.classList.add('note-disappear');
                noteElement.addEventListener('animationend', () => noteElement.remove());
            } else { alert('메모 삭제에 실패했습니다.'); }
        } catch (error) { console.error('메모 삭제 중 오류 발생:', error); }
    }

    function toggleOverlay() {
        let overlay = document.querySelector('.overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'overlay';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => {
                const enlargedNote = document.querySelector('.note-window-enlarged');
                if (enlargedNote) { enlargedNote.classList.remove('note-window-enlarged'); }
                toggleOverlay();
            });
        } else { overlay.remove(); }
    }

    // --- 음악 재생 관련 함수 ---
    async function loadLyrics() {
        try {
            const response = await fetch('/music/lyrics.txt');
            if (!response.ok) { throw new Error('가사 파일을 찾을 수 없습니다.'); }
            const lyricsText = await response.text();
            lyricsTextEl.textContent = lyricsText;
            musicPlayerSubtitleEl.textContent = lyricsText; 
            lyricsLoaded = true;
        } catch (error) {
            console.error('가사 로딩 오류:', error);
            lyricsTextEl.textContent = '가사를 불러올 수 없습니다.';
            musicPlayerSubtitleEl.textContent = '가사를 불러올 수 없습니다.';
        }
    }
    
    function togglePlayPause() {
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    }
    
    function playMusic() {
        isPlaying = true;
        playBtn.querySelector('img').src = './svgs/icon-pause.svg';
        audioPlayer.play();
    }

    function pauseMusic() {
        isPlaying = false;
        playBtn.querySelector('img').src = './svgs/icon-play.svg';
        audioPlayer.pause();
    }
    
    function updateProgressBar(e) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
    }
    
    function setTotalTime() {
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        audioPlayer.currentTime = (clickX / width) * duration;
    }
});

// =======================================================
// ===== 4. 전역 보조 함수 (Global Helper Functions) =====
// =======================================================
function updateTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        const day = days[now.getDay()];
        const month = months[now.getMonth()];
        const date = now.getDate();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeElement.textContent = `${day} ${month} ${date} ${hours}:${minutes}`;
    }
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}