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
    const musicPlayer = document.getElementById('music-player');
    const closeMusicPlayerBtn = musicPlayer.querySelector('.close-btn');

    // --- 음악 재생 컨트롤 관련 요소 ---
    const audioPlayer = document.getElementById('main-audio'); // 실제 오디오
    const playBtn = document.querySelector('.controls .play'); // 재생/일시정지 버튼
    const prevBtn = document.querySelector('.controls .prev'); // 이전 곡 버튼
    const nextBtn = document.querySelector('.controls .next'); // 다음 곡 버튼
    
    const progress = document.querySelector('.track .progress'); // 재생 진행률 바 (색깔이 채워지는 부분)
    const trackContainer = document.querySelector('.track');    // 재생 바 전체 컨테이너
    const totalTimeEl = document.querySelector('.time .total-time');    // 전체 시간 요소
    const currentTimeEl = document.querySelector('.time .last-time'); // 현재 시간 요소
    
    let isPlaying = false; // 음악 재생 상태를 추적하는 변수 (true: 재생중, false: 멈춤)


    // =============================================
    // ===== 2. 이벤트 리스너 (Event Listeners) =====
    // =============================================

    // --- 초기화 함수 실행 ---
    fetchNotes(); // 페이지 로드 시 기존 메모 불러오기
    updateTime(); // 페이지 로드 시 현재 시간 표시
    setInterval(updateTime, 1000); // 1초마다 시간 업데이트

    // --- 뮤직 플레이어 토글 이벤트 ---
    musicIcon.addEventListener('click', () => musicPlayer.classList.toggle('visible'));
    closeMusicPlayerBtn.addEventListener('click', () => musicPlayer.classList.remove('visible'));

    // --- 메모 입력 폼 제출 이벤트 ---
    form.addEventListener('submit', handleFormSubmit);

    // --- 음악 재생 컨트롤 이벤트 ---
    playBtn.addEventListener('click', togglePlayPause); // 재생 버튼 클릭 시
    audioPlayer.addEventListener('timeupdate', updateProgressBar); // 재생 시간 변경 시
    audioPlayer.addEventListener('loadedmetadata', setTotalTime); // 오디오 파일 로드 완료 시
    audioPlayer.addEventListener('ended', pauseMusic); // 음악 재생이 끝나면
    trackContainer.addEventListener('click', setProgress); // 재생 바 클릭 시


    // ========================================
    // ===== 3. 함수 (Functions) =====
    // ========================================

    /**
     * 메모 입력 폼 제출 처리 함수
     * @param {Event} e - 폼 제출 이벤트 객체
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
     * 서버에서 메모 목록을 가져와 화면에 표시하는 함수
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
     * 서버에 새 메모를 저장하는 함수
     * @param {string} content - 저장할 메모 내용
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
     * 메모 창 DOM 요소를 생성하고 모든 이벤트 리스너를 추가하는 함수
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
                    deleteNote(note.id, noteWindow);
            }
        });
    
        // --- 초록 점 (확대) 이벤트 ---
        noteWindow.querySelector('.dot.green').addEventListener('click', (e) => {
            e.stopPropagation();
            noteWindow.classList.toggle('note-window-enlarged');
            toggleOverlay();
        });
    
        notesContainer.appendChild(noteWindow);
    
        // 등장 애니메이션을 안정적으로 실행하기 위해 requestAnimationFrame 사용
        if (shouldAnimate) {
            requestAnimationFrame(() => { noteWindow.classList.remove('note-hidden'); });
        }
        return noteWindow; 
    }

    /**
     * 서버에 메모 삭제를 요청하고 화면에서 제거하는 함수
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
     * 화면에 반투명 오버레이를 만들거나 제거하는 함수
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
     * 음악 재생 상태를 토글(재생/일시정지)하는 함수
     */
    function togglePlayPause() {
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    }
    
    /**
     * 음악을 재생하고 아이콘을 '일시정지'로 변경하는 함수
     */
    function playMusic() {
        isPlaying = true;
        playBtn.querySelector('img').src = './svgs/icon-pause.svg';
        audioPlayer.play();
    }

    /**
     * 음악을 멈추고 아이콘을 '재생'으로 변경하는 함수
     */
    function pauseMusic() {
        isPlaying = false;
        playBtn.querySelector('img').src = './svgs/icon-play.svg';
        audioPlayer.pause();
    }
    
    /**
     * 음악 재생 진행률에 따라 재생 바와 현재 시간을 업데이트하는 함수
     */
    function updateProgressBar(e) {
        const { duration, currentTime } = e.srcElement;
        // 재생률(%) = (현재 시간 / 전체 시간) * 100
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
        currentTimeEl.textContent = formatTime(currentTime);
    }
    
    /**
     * 음악 파일의 전체 길이를 UI에 표시하는 함수
     */
    function setTotalTime() {
        totalTimeEl.textContent = formatTime(audioPlayer.duration);
    }

    /**
     * 재생 바(track bar)를 클릭했을 때 해당 위치로 음악을 이동시키는 함수
     */
    function setProgress(e) {
        const width = this.clientWidth; // 재생 바 전체 너비
        const clickX = e.offsetX; // 재생 바 내에서 클릭한 x좌표
        const duration = audioPlayer.duration; // 오디오 전체 길이
        audioPlayer.currentTime = (clickX / width) * duration; // 클릭 위치에 비례하여 재생 시간 변경
    }
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