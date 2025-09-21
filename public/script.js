/* script.js */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('memo-form');
    const input = document.getElementById('memo-input');
    const notesContainer = document.getElementById('notes-container');

    fetchNotes();
    updateTime();
    setInterval(updateTime, 1000);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = input.value.trim();

        if (content) {
            const newNote = await saveNote(content);
            input.value = '';

            if (newNote) {
                createNoteElement(newNote, true);

                if (notesContainer.children.length > 10) {
                    notesContainer.lastChild.remove();
                }
            }
        }
    });

    async function fetchNotes() {
        try {
            const response = await fetch('/api/notes');
            const notes = await response.json();
            
            notesContainer.innerHTML = '';
            
            notes.reverse().forEach(note => {
                createNoteElement(note, false); 
            });
        } catch (error) {
            console.error('메모를 불러오는 중 오류가 발생했습니다:', error);
        }
    }

    async function saveNote(content) {
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            return await response.json();
        } catch (error) {
            console.error('메모를 저장하는 중 오류가 발생했습니다:', error);
        }
    }

    function createNoteElement(note, shouldAnimate = false) {
        const noteWindow = document.createElement('div');
        noteWindow.classList.add('note-window');

        if (shouldAnimate) {
            noteWindow.classList.add('note-appear');
        }

        noteWindow.innerHTML = `
            <div class="title-bar">
                <div class="dot red"></div>
                <div class="dot yellow"></div>
                <div class="dot green"></div>
            </div>
            <div class="content">
                ${note.content} 
            </div>
        `;
    
    // 1. 새로 생성된 메모 창 안에서 빨간 점(.dot.red) 요소를 찾습니다.
    const deleteButton = noteWindow.querySelector('.dot.red');

    // 2. 빨간 점에 클릭 이벤트 리스너를 추가합니다.
    deleteButton.addEventListener('click', () => {
        // 3. 사용자에게 정말 삭제할 것인지 확인하는 팝업을 띄웁니다.
        const isConfirmed = confirm('이 메모를 정말 삭제하시겠습니까?');

        // 4. 사용자가 '확인'을 눌렀을 경우에만 삭제를 진행합니다.
        if (isConfirmed) {
            deleteNote(note.id, noteWindow);
        }
    });

    notesContainer.prepend(noteWindow);
}
});

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
 * 서버에 메모 삭제를 요청하고, 성공 시 화면에서 메모 창을 제거하는 함수
 * @param {number} noteId - 삭제할 메모의 ID
 * @param {HTMLElement} noteElement - 화면에서 제거할 메모 창 요소
 */
async function deleteNote(noteId, noteElement) {
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            // 서버에서 성공적으로 삭제되면, 화면에서도 애니메이션과 함께 제거
            noteElement.classList.add('note-disappear');
            
            // 애니메이션이 끝난 후 DOM에서 완전히 제거
            noteElement.addEventListener('animationend', () => {
                noteElement.remove();
            });
        } else {
            alert('메모 삭제에 실패했습니다.');
        }
    } catch (error) {
        console.error('메모 삭제 중 오류 발생:', error);
    }
}