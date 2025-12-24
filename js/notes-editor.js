// Notes Canvas Editor

const currentUser = requireAuth();
let canvas;
let currentBook = null;
let currentNoteId = null;
let isDrawingMode = false;
let canvasHistory = [];
let defaultFill = '#342E59';
let defaultStroke = '#F2F2F2';
let defaultText = '#F2F2F2';
let defaultBg = '#404040';

// Get book ID and note ID from URL
const urlParams = new URLSearchParams(window.location.search);
const bookId = parseInt(urlParams.get('book'));
const noteId = urlParams.get('note'); // If editing existing note

// Initialize canvas
function initCanvas() {
    canvas = new fabric.Canvas('noteCanvas', {
        width: 1100,
        height: 700,
        backgroundColor: defaultBg
    });

    // Enable object controls
    canvas.on('selection:created', updateToolbar);
    canvas.on('selection:updated', updateToolbar);
    canvas.on('selection:cleared', updateToolbar);
    
    // Save state after modifications
    canvas.on('object:added', saveState);
    canvas.on('object:modified', saveState);

    // set initial brush defaults
    canvas.freeDrawingBrush.color = defaultText;
    canvas.freeDrawingBrush.width = parseInt(document.getElementById('brushSize').value || '5');
}

function saveState() {
    const json = JSON.stringify(canvas.toJSON());
    canvasHistory.push(json);
    // Limit history to last 20 states
    if (canvasHistory.length > 20) {
        canvasHistory.shift();
    }
}

// Load book info
async function loadBookInfo() {
    try {
        const allBooks = await API.getAllBooks();
        currentBook = allBooks.find(b => b.id === bookId);
        
        if (!currentBook) {
            alert('Book not found!');
            window.history.back();
            return;
        }

        // Display book info
        document.getElementById('bookTitle').textContent = currentBook.title;
        document.getElementById('bookAuthor').textContent = `by ${currentBook.author}`;
        const bookLink = document.getElementById('bookPageLink');
        if (bookLink) {
            bookLink.href = `book-detail.html?id=${currentBook.id}`;
        }
        
        const coverDiv = document.getElementById('bookMiniCover');
        if (currentBook.image_url) {
            coverDiv.innerHTML = `<img src="${currentBook.image_url}" alt="${currentBook.title}">`;
        }
    } catch (error) {
        console.error('Error loading book:', error);
    }
}

// Load existing note if editing
async function loadExistingNote() {
    if (!noteId) return;

    try {
        const notes = JSON.parse(localStorage.getItem(`notes_${currentUser.id}`) || '[]');
        const note = notes.find(n => n.id === parseInt(noteId));
        
        if (note && note.canvas_data) {
            // Load canvas from JSON
            canvas.loadFromJSON(note.canvas_data, () => {
                canvas.renderAll();
                // Set background color picker
                document.getElementById('bgColor').value = canvas.backgroundColor || '#404040';
            });
            
            // Set public checkbox
            document.getElementById('isPublic').checked = note.is_public || false;
            currentNoteId = note.id;
        }
    } catch (error) {
        console.error('Error loading note:', error);
    }
}

// ========== TOOLBAR FUNCTIONS ==========

function addText() {
    const text = new fabric.IText('Double-click to edit', {
        left: 100,
        top: 100,
        fontFamily: 'Times New Roman',
        fontSize: 20,
        fill: defaultText
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
}

function addImage(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        fabric.Image.fromURL(e.target.result, (img) => {
            // Scale image to fit canvas
            const maxWidth = 300;
            const maxHeight = 300;
            
            if (img.width > maxWidth || img.height > maxHeight) {
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                img.scale(scale);
            }
            
            img.set({
                left: 100,
                top: 100
            });
            
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
    
    // Reset input
    event.target.value = '';
}

function toggleStickerMenu() {
    const menu = document.getElementById('stickerPicker');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function addSticker(emoji) {
    const text = new fabric.Text(emoji, {
        left: 100,
        top: 100,
        fontSize: 64,
        selectable: true
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    
    // Close sticker menu
    document.getElementById('stickerPicker').style.display = 'none';
}

function toggleBold() {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        obj.set('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold');
        canvas.renderAll();
    }
}

function toggleItalic() {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        obj.set('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic');
        canvas.renderAll();
    }
}

function toggleUnderline() {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        obj.set('underline', !obj.underline);
        canvas.renderAll();
    }
}

// ========== SHAPES ==========

function addRectangle() {
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        width: 150,
        height: 100,
        fill: defaultFill,
        stroke: defaultStroke,
        strokeWidth: 2
    });
    canvas.add(rect);
    canvas.setActiveObject(rect);
    canvas.renderAll();
}

function addCircle() {
    const circle = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: defaultFill,
        stroke: defaultStroke,
        strokeWidth: 2
    });
    canvas.add(circle);
    canvas.setActiveObject(circle);
    canvas.renderAll();
}

function addTriangle() {
    const triangle = new fabric.Triangle({
        left: 100,
        top: 100,
        width: 100,
        height: 100,
        fill: defaultFill,
        stroke: defaultStroke,
        strokeWidth: 2
    });
    canvas.add(triangle);
    canvas.setActiveObject(triangle);
    canvas.renderAll();
}

function addLine() {
    const line = new fabric.Line([50, 100, 200, 100], {
        left: 100,
        top: 100,
        stroke: defaultStroke,
        strokeWidth: 3
    });
    canvas.add(line);
    canvas.setActiveObject(line);
    canvas.renderAll();
}

// ========== ALIGNMENT ==========

function alignLeft() {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        obj.set('textAlign', 'left');
        canvas.renderAll();
    }
}

function alignCenter() {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        obj.set('textAlign', 'center');
        canvas.renderAll();
    }
}

function alignRight() {
    const obj = canvas.getActiveObject();
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        obj.set('textAlign', 'right');
        canvas.renderAll();
    }
}

// ========== COLORS ==========

function changeFillColor() {
    const color = document.getElementById('fillColor').value;
    const active = canvas.getActiveObjects();
    if (active && active.length) {
        active.forEach(obj => {
            if ('fill' in obj) obj.set('fill', color);
        });
        canvas.renderAll();
    }
    defaultFill = color;
}

function changeStrokeColor() {
    const color = document.getElementById('strokeColor').value;
    const active = canvas.getActiveObjects();
    if (active && active.length) {
        active.forEach(obj => {
            if ('stroke' in obj) obj.set('stroke', color);
        });
        canvas.renderAll();
    }
    defaultStroke = color;
}

// ========== DRAWING ==========

function toggleDrawing() {
    isDrawingMode = !isDrawingMode;
    canvas.isDrawingMode = isDrawingMode;
    
    const btn = document.getElementById('drawBtn');
    if (isDrawingMode) {
        btn.style.background = 'var(--color-primary)';
        btn.style.borderColor = 'var(--color-primary)';
        canvas.freeDrawingBrush.color = document.getElementById('textColor').value;
        canvas.freeDrawingBrush.width = parseInt(document.getElementById('brushSize').value);
    } else {
        btn.style.background = 'rgba(242, 242, 242, 0.05)';
        btn.style.borderColor = 'var(--border-color)';
    }
}

function changeBrushSize() {
    const size = parseInt(document.getElementById('brushSize').value);
    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.width = size;
    }
}

// ========== TRANSFORM ==========

function duplicateSelected() {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.clone(function(cloned) {
            cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
        });
    }
}

function flipHorizontal() {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.set('flipX', !obj.flipX);
        canvas.renderAll();
    }
}

function flipVertical() {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.set('flipY', !obj.flipY);
        canvas.renderAll();
    }
}

function rotateObject() {
    const obj = canvas.getActiveObject();
    if (obj) {
        obj.rotate((obj.angle + 90) % 360);
        canvas.renderAll();
    }
}

function undoLast() {
    if (canvasHistory.length > 0) {
        const previousState = canvasHistory.pop();
        canvas.loadFromJSON(previousState, () => {
            canvas.renderAll();
        });
    }
}

function changeFontSize() {
    const obj = canvas.getActiveObject();
    const size = parseInt(document.getElementById('fontSize').value);
    
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        obj.set('fontSize', size);
        canvas.renderAll();
    }
}

function changeTextColor() {
    const color = document.getElementById('textColor').value;
    
    const active = canvas.getActiveObjects();
    if (active && active.length) {
        active.forEach(obj => {
            if (obj.type === 'i-text' || obj.type === 'text') {
                obj.set('fill', color);
            }
        });
        canvas.renderAll();
    }

    // Also update brush color if in drawing mode
    if (canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush.color = color;
    }
    defaultText = color;
}

function changeBackground() {
    const color = document.getElementById('bgColor').value;
    canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
    defaultBg = color;
}

function deleteSelected() {
    const obj = canvas.getActiveObject();
    if (obj) {
        canvas.remove(obj);
        canvas.renderAll();
    }
}

function bringToFront() {
    const obj = canvas.getActiveObject();
    if (obj) {
        canvas.bringToFront(obj);
        canvas.renderAll();
    }
}

function sendToBack() {
    const obj = canvas.getActiveObject();
    if (obj) {
        canvas.sendToBack(obj);
        canvas.renderAll();
    }
}

function clearCanvas() {
    if (confirm('Are you sure you want to clear the entire canvas?')) {
        canvas.clear();
        canvas.setBackgroundColor('#404040', canvas.renderAll.bind(canvas));
        document.getElementById('bgColor').value = '#404040';
    }
}

function updateToolbar() {
    const obj = canvas.getActiveObject();
    
    if (obj && (obj.type === 'i-text' || obj.type === 'text')) {
        // Update font size dropdown
        document.getElementById('fontSize').value = obj.fontSize || 20;
        // Update text color
        document.getElementById('textColor').value = obj.fill || '#F2F2F2';
        defaultText = document.getElementById('textColor').value;
    }
    
    if (obj && obj.fill && typeof obj.fill === 'string') {
        document.getElementById('fillColor').value = obj.fill;
        defaultFill = obj.fill;
    }
    
    if (obj && obj.stroke && typeof obj.stroke === 'string') {
        document.getElementById('strokeColor').value = obj.stroke;
        defaultStroke = obj.stroke;
    }
}

// ========== SAVE & EXPORT ==========

async function saveNote() {
    if (canvas.getObjects().length === 0) {
        alert('Canvas is empty! Add some content first.');
        return;
    }

    try {
        // Get canvas data as JSON
        const canvasData = canvas.toJSON();
        
        // Generate thumbnail (smaller version)
        const thumbnail = await generateThumbnail();
        
        // Create note object
        const note = {
            id: currentNoteId || Date.now(),
            user_id: currentUser.id,
            book_id: bookId,
            book_title: currentBook.title,
            book_author: currentBook.author,
            canvas_data: canvasData,
            thumbnail: thumbnail,
            is_public: document.getElementById('isPublic').checked,
            created_at: currentNoteId ? getCurrentNote().created_at : new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Save to localStorage
        const notes = JSON.parse(localStorage.getItem(`notes_${currentUser.id}`) || '[]');
        
        if (currentNoteId) {
            // Update existing note
            const index = notes.findIndex(n => n.id === currentNoteId);
            if (index !== -1) {
                notes[index] = note;
            }
        } else {
            // Add new note
            notes.push(note);
            currentNoteId = note.id;
        }
        
        localStorage.setItem(`notes_${currentUser.id}`, JSON.stringify(notes));
        
        alert('Note saved successfully!');
    } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save note.');
    }
}

function getCurrentNote() {
    const notes = JSON.parse(localStorage.getItem(`notes_${currentUser.id}`) || '[]');
    return notes.find(n => n.id === currentNoteId) || { created_at: new Date().toISOString() };
}

async function generateThumbnail() {
    // Create a smaller version for thumbnail
    const scale = 0.25; // 25% of original size
    const dataURL = canvas.toDataURL({
        format: 'png',
        multiplier: scale,
        quality: 0.8
    });
    return dataURL;
}

function exportPNG() {
    if (canvas.getObjects().length === 0) {
        alert('Canvas is empty! Add some content first.');
        return;
    }

    // Generate filename
    const filename = `note_${currentBook.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`;
    
    // Export canvas as PNG
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
    });
    
    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.click();
}

// ========== KEYBOARD SHORTCUTS ==========

document.addEventListener('keydown', (e) => {
    // Delete key
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const obj = canvas.getActiveObject();
        if (obj && obj.type !== 'i-text') { // Don't delete if editing text
            e.preventDefault();
            deleteSelected();
        }
    }
    
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        toggleBold();
    }
    
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        toggleItalic();
    }
    
    // Ctrl/Cmd + U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        toggleUnderline();
    }
    
    // Ctrl/Cmd + D to duplicate
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
    }
    
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveNote();
    }
    
    // Ctrl/Cmd + Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoLast();
    }
});

function goBack() {
    if (canvas.getObjects().length > 0) {
        if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
            window.history.back();
        }
    } else {
        window.history.back();
    }
}

// ========== INITIALIZATION ==========

window.addEventListener('load', () => {
    initCanvas();
    loadBookInfo();
    loadExistingNote();
});
