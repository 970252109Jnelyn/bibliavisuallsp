// --- BASE DE DATOS LOCAL BÍBLICA ---
const bibleDatabase = {
    '3juan-1-14': {
        title: '3 Juan 1:14',
        rvr1960: 'Espero verte en breve, y hablaremos cara a cara.',
        ntv: 'Espero verte pronto, y entonces hablaremos cara a cara.',
        simplificado: 'Yo espero verte pronto. Nosotros hablaremos cara a cara.'
    },
    'judas-1-25': {
        title: 'Judas 1:25',
        rvr1960: 'Al único y sabio Dios, nuestro Salvador, sea gloria y majestad, imperio y potencia, ahora y por todos los siglos. Amén.',
        ntv: 'A él, que es el único Dios, nuestro Salvador por medio de Jesucristo nuestro Señor. ¡A él sea toda la gloria, la majestad, el poder y la autoridad, desde antes de todos los tiempos, en el presente y por toda la eternidad! Amén.',
        simplificado: 'Dios es único. Dios nos salva por Jesucristo. Dios tiene gloria, majestad y poder para siempre. Amén.'
    }
};

// --- SISTEMA DE VIDEOS (ADMIN Y LOCALSTORAGE) ---
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
}

function getVideos() {
    return JSON.parse(localStorage.getItem('lsp_videos')) || {};
}

function saveVideoLink(event) {
    event.preventDefault();
    const book = document.getElementById('admin-book').value;
    const chapter = document.getElementById('admin-chapter').value;
    const verse = document.getElementById('admin-verse').value;
    const url = document.getElementById('admin-url').value;

    const videoId = extractYouTubeId(url);
    if(videoId.length !== 11) {
        alert("Por favor, ingresa un enlace válido de YouTube.");
        return;
    }

    const key = `${book}-${chapter}-${verse}`;
    const videos = getVideos();
    videos[key] = videoId;
    localStorage.setItem('lsp_videos', JSON.stringify(videos));

    document.getElementById('admin-video-form').reset();
    renderVideoList();
    
    if(document.getElementById('verse-selector').value === key) {
        loadSelectedVerse();
    }
    alert("Video guardado y asociado correctamente.");
}

function deleteVideo(key) {
    if(confirm("¿Estás seguro de eliminar este enlace de video?")) {
        const videos = getVideos();
        delete videos[key];
        localStorage.setItem('lsp_videos', JSON.stringify(videos));
        renderVideoList();
        if(document.getElementById('verse-selector').value === key) {
            loadSelectedVerse();
        }
    }
}

function renderVideoList() {
    const videos = getVideos();
    const tbody = document.getElementById('video-list-table');
    tbody.innerHTML = '';

    for (const [key, id] of Object.entries(videos)) {
        const parts = key.split('-');
        let readableRef = key;
        if(parts.length === 3) readableRef = `${parts[0].replace('3juan', '3 Juan').replace('judas', 'Judas')} ${parts[1]}:${parts[2]}`;

        tbody.innerHTML += `
            <tr class="border-b dark:border-gray-700">
                <td class="p-3 font-bold">${readableRef}</td>
                <td class="p-3 text-sm text-gray-500">${id}</td>
                <td class="p-3 text-center">
                    <button onclick="deleteVideo('${key}')" class="text-red-500 hover:text-red-700 bg-red-100 dark:bg-red-900/30 p-2 rounded-lg" aria-label="Eliminar video">🗑️</button>
                </td>
            </tr>
        `;
    }
}

// --- NAVEGACIÓN Y ESTADO ---
let currentVerseKey = '3juan-1-14';

function navigate(viewId) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    document.getElementById(`view-${viewId}`).classList.remove('hidden');
    
    if(viewId === 'reader') loadSelectedVerse();
    if(viewId === 'favorites') renderFavorites();
    if(viewId === 'admin') renderVideoList();
}

// --- LÓGICA DEL LECTOR BÍBLICO ---
function loadSelectedVerse() {
    currentVerseKey = document.getElementById('verse-selector').value;
    const translation = document.getElementById('translation-selector').value;
    const verseData = bibleDatabase[currentVerseKey];
    
    document.getElementById('verse-title').innerText = verseData.title;
    document.getElementById('verse-content').innerHTML = `<span>${verseData[translation]}</span>`;
    
    checkFavoriteStatus();
    loadVideoIframe();
}

function loadVideoIframe() {
    const wrapper = document.getElementById('video-wrapper');
    const controls = document.getElementById('video-controls');
    const videos = getVideos();
    const videoId = videos[currentVerseKey];

    if (videoId) {
        wrapper.innerHTML = `
            <iframe id="yt-player" class="absolute top-0 left-0 w-full h-full" 
                src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0&controls=1" 
                title="Video en Lengua de Señas Peruana" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        controls.classList.remove('hidden');
    } else {
        wrapper.innerHTML = `
            <div class="p-6 text-center text-gray-400">
                <div class="text-4xl mb-3">🚫🎥</div>
                <p class="font-bold">Este versículo todavía no tiene un video en Lengua de Señas Peruana.</p>
                <p class="text-sm mt-2">Puedes añadir un enlace desde la sección 'Videos LSP'.</p>
            </div>
        `;
        controls.classList.add('hidden');
    }
}

function reloadVideo() {
    const iframe = document.getElementById('yt-player');
    if (iframe) {
        const src = iframe.src;
        iframe.src = src;
    }
}

function copyVerse() {
    const text = document.getElementById('verse-content').innerText;
    const title = document.getElementById('verse-title').innerText;
    navigator.clipboard.writeText(`${title} - ${text}\n(Biblia Visual)`).then(() => {
        alert("¡Versículo copiado al portapapeles!");
    });
}

// --- SISTEMA DE SUBRAYADO ---
let currentSelectionRange = null;

document.addEventListener('mouseup', (e) => {
    const selection = window.getSelection();
    const menu = document.getElementById('highlight-menu');
    
    if (selection.isCollapsed) {
        menu.style.display = 'none';
        return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const isInsideVerse = container.nodeType === 3 ? container.parentNode.closest('.verse-text') : container.closest('.verse-text');

    if (isInsideVerse) {
        currentSelectionRange = range.cloneRange();
        const rect = range.getBoundingClientRect();
        menu.style.display = 'flex';
        menu.style.top = `${rect.bottom + window.scrollY + 10}px`;
        menu.style.left = `${rect.left + window.scrollX}px`;
    } else {
        menu.style.display = 'none';
        currentSelectionRange = null;
    }
});

function applyHighlight(colorClass) {
    if (!currentSelectionRange) return;
    const span = document.createElement('span');
    span.className = `highlight-${colorClass} rounded px-1 cursor-pointer transition-colors`;
    
    try {
        currentSelectionRange.surroundContents(span);
        window.getSelection().removeAllRanges();
        document.getElementById('highlight-menu').style.display = 'none';
        saveAnnotations();
    } catch (e) {
        console.warn("Selección cruzada no soportada para subrayado simple.");
    }
}

function removeHighlight() {
    if (!currentSelectionRange) return;
    const container = currentSelectionRange.commonAncestorContainer;
    const spanEl = container.nodeType === 3 ? container.parentNode : container;
    
    if(spanEl.tagName === 'SPAN' && spanEl.className.includes('highlight-')) {
        const text = document.createTextNode(spanEl.textContent);
        spanEl.parentNode.replaceChild(text, spanEl);
        saveAnnotations();
    }
    window.getSelection().removeAllRanges();
    document.getElementById('highlight-menu').style.display = 'none';
}

function saveAnnotations() {
    const htmlContent = document.getElementById('verse-content').innerHTML;
    localStorage.setItem(`annotations_${currentVerseKey}`, htmlContent);
}

// --- FAVORITOS ---
function toggleFavorite() {
    let favs = JSON.parse(localStorage.getItem('lsp_favorites')) || [];
    const btn = document.getElementById('btn-favorite');
    
    if(favs.includes(currentVerseKey)) {
        favs = favs.filter(k => k !== currentVerseKey);
        btn.innerText = '🤍';
    } else {
        favs.push(currentVerseKey);
        btn.innerText = '💖';
    }
    localStorage.setItem('lsp_favorites', JSON.stringify(favs));
}

function checkFavoriteStatus() {
    const favs = JSON.parse(localStorage.getItem('lsp_favorites')) || [];
    const btn = document.getElementById('btn-favorite');
    if(favs.includes(currentVerseKey)) {
        btn.innerText = '💖';
    } else {
        btn.innerText = '🤍';
    }
}

function renderFavorites() {
    const favs = JSON.parse(localStorage.getItem('lsp_favorites')) || [];
    const container = document.getElementById('favorites-container');
    container.innerHTML = '';
    
    if(favs.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No tienes versículos guardados aún.</p>';
        return;
    }

    favs.forEach(key => {
        const data = bibleDatabase[key];
        if(data) {
            container.innerHTML += `
                <div class="bg-white dark:bg-darkCard p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h4 class="font-bold text-lg text-primary dark:text-blue-400">${data.title}</h4>
                        <p class="text-gray-600 dark:text-gray-300 mt-1">${data.simplificado}</p>
                    </div>
                    <button onclick="document.getElementById('verse-selector').value='${key}'; navigate('reader');" class="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 p-3 rounded-full">
                        ➡️
                    </button>
                </div>
            `;
        }
    });
}

// --- CONFIGURACIÓN Y ACCESIBILIDAD ---
function setTheme(theme) {
    if(theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('lsp_theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('lsp_theme', 'light');
    }
}

function setTextSize(sizeClass) {
    const content = document.getElementById('verse-content');
    content.classList.remove('text-sm-custom', 'text-md-custom', 'text-lg-custom');
    content.classList.add(sizeClass);
    localStorage.setItem('lsp_textSize', sizeClass);
}

function toggleAuth(isLoggingIn) {
    if(isLoggingIn) {
        document.getElementById('auth-status-logged-out').classList.add('hidden');
        document.getElementById('auth-status-logged-in').classList.remove('hidden');
    } else {
        document.getElementById('auth-status-logged-out').classList.remove('hidden');
        document.getElementById('auth-status-logged-in').classList.add('hidden');
    }
}

// --- INICIALIZACIÓN ---
window.onload = () => {
    if(localStorage.getItem('lsp_theme') === 'dark') {
        setTheme('dark');
    }
    const savedSize = localStorage.getItem('lsp_textSize');
    if(savedSize) setTextSize(savedSize);
    
    navigate('home');
};