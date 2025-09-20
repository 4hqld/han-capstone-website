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