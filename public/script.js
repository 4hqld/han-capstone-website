/* script.js */

// 웹 페이지의 모든 HTML 요소가 로드된 후 스크립트가 실행되도록 합니다.
document.addEventListener('DOMContentLoaded', () => {

    // =============================================
    // ===== 1. UI 요소 선택 (DOM Elements) =====
    // =============================================

    // --- 메모 관련 요소 ---
    const form = document.getElementById('memo-form');
    const input = document.getElementById('memo-input');
    const notesContainer = document.getElementById('notes-container');

    // --- 뮤직 플레이어 UI 관련 요소 ---
    const musicIcon = document.getElementById('dock-music-icon');
    const lyricsIcon = document.getElementById('dock-lyrics-icon'); // 💬 '가사 바로가기' 아이콘
    const musicPlayer = document.getElementById('music-player');
    const closeMusicPlayerBtn = musicPlayer.querySelector('.close-btn');

    // --- 음악 재생 컨트롤 관련 요소 ---
    const audioPlayer = document.getElementById('main-audio');
    const playBtn = document.querySelector('.controls .play');
    const prevBtn = document.querySelector('.controls .prev');
    const nextBtn = document.querySelector('.controls .next');
    
    const progress = document.querySelector('.track .progress');
    const trackContainer = document.querySelector('.track');
    const totalTimeEl = document.querySelector('.time .total-time');
    const currentTimeEl = document.querySelector('.time .last-time');

    // --- 상태 변수 (State Variables) ---
    let isPlaying = false;
    let lyricsLoaded = false;

    // --- 가사 사이드바 관련 요소 ---
    const lyricsSidebar = document.getElementById('lyrics-sidebar');
    const closeLyricsSidebarBtn = lyricsSidebar.querySelector('.close-btn');
    const lyricsTextEl = lyricsSidebar.querySelector('.lyrics-text');

    // --- 뮤직 플레이어 가사창 요소 ---
    const musicPlayerSubtitleEl = musicPlayer.querySelector('.subtitle'); // 뮤직 플레이어 내 가사창

    // --- 크레딧 모달 관련 요소 ---
    const settingsIcon = document.getElementById('dock-settings-icon');
    const creditsModal = document.getElementById('credits-modal');
    const closeCreditsModalBtn = creditsModal.querySelector('.close-btn');

    // --- 파인더 이미지 모달 관련 요소 ---
    const finderIcon = document.getElementById('dock-finder-icon');
    const finderModal = document.getElementById('finder-modal');
    const closeFinderModalBtn = finderModal.querySelector('.close-btn');
    
    // --- '모두 닫기' 아이콘 (📝) ---
    const memoIcon = document.getElementById('dock-memo-icon');

    // =============================================
    // ===== 2. 이벤트 리스너 (Event Listeners) =====
    // =============================================

    // --- 초기화 함수 실행 ---
    fetchNotes();
    updateTime();
    setInterval(updateTime, 1000);

    // --- 뮤직 플레이어 토글 이벤트 (🎵 아이콘) ---
    musicIcon.addEventListener('click', () => {
        // 1. 열기 전에, 다른 창(가사)을 닫습니다.
        lyricsSidebar.classList.remove('visible');

        // 2. 뮤직 플레이어를 토글합니다.
        musicPlayer.classList.toggle('visible');

        // 3. (필요시) 가사를 로드합니다.
        if (musicPlayer.classList.contains('visible') && !lyricsLoaded) {
            loadLyrics();
        }
    });

    // --- 가사 바로가기 이벤트 (💬 아이콘) ---
    lyricsIcon.addEventListener('click', () => {
        // 1. 열기 전에, 다른 창(뮤직 플레이어)을 닫습니다.
        musicPlayer.classList.remove('visible');

        // 2. 가사 사이드바를 토글합니다.
        lyricsSidebar.classList.toggle('visible');

        // 3. (필요시) 가사를 로드합니다.
        if (lyricsSidebar.classList.contains('visible') && !lyricsLoaded) {
            loadLyrics();
        }
    });

    // --- 플레이어 닫기 버튼 이벤트 ---
    closeMusicPlayerBtn.addEventListener('click', () => musicPlayer.classList.remove('visible'));

    // ✅ --- 가사 모달 닫기 버튼 이벤트 (새로 추가) ---
    // --- 가사 사이드바 닫기 버튼 이벤트 ---
    closeLyricsSidebarBtn.addEventListener('click', () => {
        lyricsSidebar.classList.remove('visible');
    });

    // --- 메모 입력 폼 제출 이벤트 ---
    form.addEventListener('submit', handleFormSubmit);

    // --- 음악 재생 컨트롤 이벤트 ---
    playBtn.addEventListener('click', togglePlayPause);
    audioPlayer.addEventListener('timeupdate', updateProgressBar);
    audioPlayer.addEventListener('loadedmetadata', setTotalTime);
    audioPlayer.addEventListener('ended', pauseMusic);
    trackContainer.addEventListener('click', setProgress);


    // ========================================
    // ===== 3. 함수 (Functions) =====
    // ========================================

    /**
     * 메모 입력 폼 제출 처리 함수
     */
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

    /**
     * 서버에서 메모 목록을 가져와 화면에 표시
     */
    async function fetchNotes() {
        try {
            const response = await fetch('/api/notes');
            const notes = await response.json();
            notesContainer.innerHTML = '';
            notes.reverse().forEach(note => createNoteElement(note, false));
        } catch (error) { console.error('메모를 불러오는 중 오류가 발생했습니다:', error); }
    }

    /**
     * 서버에 새 메모를 저장
     */
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

    /**
     * 메모 창 DOM 요소를 생성하고 모든 이벤트 리스너를 추가
     */
    function createNoteElement(note, shouldAnimate = false) {
        const noteWindow = document.createElement('div');
        noteWindow.classList.add('note-window');
        if (shouldAnimate) { noteWindow.classList.add('note-hidden'); }
        noteWindow.innerHTML = `<div class="title-bar"><div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div></div><div class="content">${note.content}</div>`;
        
        // --- 빨간 점 (삭제/닫기) 이벤트 ---
        noteWindow.querySelector('.dot.red').addEventListener('click', (e) => {
            e.stopPropagation();
            if (noteWindow.classList.contains('note-window-enlarged')) {
                noteWindow.classList.remove('note-window-enlarged');
                toggleOverlay();
            } else {
                deleteNote(note.id, noteWindow); // 확인 창 없는 버전
            }
        });
    
        // --- 초록 점 (확대) 이벤트 ---
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

    /**
     * 서버에 메모 삭제를 요청하고 화면에서 제거
     */
    async function deleteNote(noteId, noteElement) {
        try {
            const response = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
            if (response.ok) {
                noteElement.classList.add('note-disappear');
                noteElement.addEventListener('animationend', () => noteElement.remove());
            } else { alert('메모 삭제에 실패했습니다.'); }
        } catch (error) { console.error('메모 삭제 중 오류 발생:', error); }
    }

    /**
     * 창 확대 시 뒷배경 오버레이를 토글
     */
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

    /**
     * .txt 파일에서 가사를 비동기로 불러와 가사 모달에 채우는 함수
     */
    async function loadLyrics() {
        try {
            const response = await fetch('/music/lyrics.txt');
            if (!response.ok) {
                throw new Error('가사 파일을 찾을 수 없습니다.');
            }
            const lyricsText = await response.text();

            // ✅ 두 요소 모두에 가사를 채웁니다.
            lyricsTextEl.textContent = lyricsText;
            musicPlayerSubtitleEl.textContent = lyricsText; 

            lyricsLoaded = true;
        } catch (error) {
            console.error('가사 로딩 오류:', error);
            // ✅ 두 요소 모두에 오류 메시지를 표시합니다.
            lyricsTextEl.textContent = '가사를 불러올 수 없습니다.';
            musicPlayerSubtitleEl.textContent = '가사를 불러올 수 없습니다.';
        }
    }
    
    /**
     * 음악 재생 상태를 토글(재생/일시정지)
     */
    function togglePlayPause() {
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    }
    
    /**
     * 음악을 재생하고 아이콘을 '일시정지'로 변경
     */
    function playMusic() {
        isPlaying = true;
        playBtn.querySelector('img').src = './svgs/icon-pause.svg';
        audioPlayer.play();
    }

    /**
     * 음악을 멈추고 아이콘을 '재생'으로 변경
     */
    function pauseMusic() {
        isPlaying = false;
        playBtn.querySelector('img').src = './svgs/icon-play.svg';
        audioPlayer.pause();
    }
    
    /**
     * 음악 재생 진행률에 따라 재생 바와 현재 시간을 업데이트
     */
    function updateProgressBar(e) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
    }
    
    /**
     * 음악 파일의 전체 길이를 UI에 표시
     */
    function setTotalTime() {
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
    }

    /**
     * 재생 바(track bar)를 클릭했을 때 해당 위치로 음악을 이동
     */
    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        audioPlayer.currentTime = (clickX / width) * duration;
    }
    // --- 가사 사이드바 닫기 버튼 이벤트 ---
closeLyricsSidebarBtn.addEventListener('click', () => {
    lyricsSidebar.classList.remove('visible');
});

// --- 크레딧 모달 열기 이벤트 (⚙️ 아이콘) ---
    settingsIcon.addEventListener('click', () => {
        // 다른 사이드바는 닫음
        musicPlayer.classList.remove('visible');
        lyricsSidebar.classList.remove('visible');
        finderModal.classList.remove('visible'); // ✅ 추가
        // 크레딧 창 열기
        creditsModal.classList.add('visible');
        });

        // --- 크레딧 모달 닫기 버튼 이벤트 ---
        closeCreditsModalBtn.addEventListener('click', () => {
            creditsModal.classList.remove('visible');
        });

        // (선택 사항) 모달 바깥쪽 어두운 영역 클릭 시 닫기
        creditsModal.addEventListener('click', (e) => {
            if (e.target === creditsModal) {
                creditsModal.classList.remove('visible');
        }
    });
// --- 크레딧 모달 닫기 버튼 이벤트 ---
closeCreditsModalBtn.addEventListener('click', () => {
    creditsModal.classList.remove('visible');
});
// (선택 사항) 모달 바깥쪽 어두운 영역 클릭 시 닫기
creditsModal.addEventListener('click', (e) => {
    if (e.target === creditsModal) {
        creditsModal.classList.remove('visible');
    }
});

// --- 파인더 이미지 모달 열기 이벤트 (🏞️ 아이콘) ---
    finderIcon.addEventListener('click', () => {
        // 다른 사이드바와 모달 모두 닫음
        musicPlayer.classList.remove('visible');
        lyricsSidebar.classList.remove('visible');
        creditsModal.classList.remove('visible'); // ✅ 추가

        // 파인더 이미지 창 열기
        finderModal.classList.add('visible');
});

    // --- 파인더 이미지 모달 닫기 버튼 이벤트 ---
    closeFinderModalBtn.addEventListener('click', () => {
        finderModal.classList.remove('visible');
    });

// (선택 사항) 모달 바깥쪽 어두운 영역 클릭 시 닫기
    finderModal.addEventListener('click', (e) => {
        if (e.target === finderModal) {
            finderModal.classList.remove('visible');
        }
    });
// --- '모두 닫기' 아이콘 (📝) 이벤트 --
// --- 모든 창 닫기 이벤트 (📝 아이콘) ---
        memoIcon.addEventListener('click', () => {
        musicPlayer.classList.remove('visible');
        lyricsSidebar.classList.remove('visible');
        creditsModal.classList.remove('visible');
        finderModal.classList.remove('visible');
    });
});

// =======================================================
// ===== 4. 전역 보조 함수 (Global Helper Functions) =====
// =======================================================

/**
 * 상단 바의 시간을 업데이트하는 함수
 */
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

/**
 * 초 단위 시간을 mm:ss 형식의 문자열로 변환하는 함수
 */
function formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}