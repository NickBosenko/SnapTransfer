document.addEventListener('DOMContentLoaded', function() {
    const chooseBtn = document.getElementById('chooseBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const filesContainer = document.getElementById('filesContainer');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const uploadStatus = document.getElementById('uploadStatus');
    const languageSelect = document.getElementById('language');

    let currentViewMode = 'list-view'; // по умолчанию

    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            // Images
            'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'bmp': '🖼️', 'webp': '🖼️',
            // Videos
            'mp4': '🎥', 'avi': '🎥', 'mov': '🎥', 'wmv': '🎥', 'flv': '🎥', 'mkv': '🎥',
            // Music
            'mp3': '🎵', 'wav': '🎵', 'ogg': '🎵', 'flac': '🎵', 'm4a': '🎵',
            // Documents
            'pdf': '📄', 'doc': '📄', 'docx': '📄', 'txt': '📄', 'xls': '📄', 'xlsx': '📄', 'ppt': '📄', 'pptx': '📄'
        };
        return icons[ext] || '📁';
    }

    function isImageFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
    }

    function isVideoFile(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(ext);
    }

    function createFilePreview(file, dateFolder, category) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const filePath = `/uploads/${dateFolder}/${category}/${file}`;
        
        if (isImageFile(file)) {
            const img = document.createElement('img');
            img.src = filePath;
            img.className = 'file-preview';
            img.alt = file;
            fileItem.appendChild(img);
        } else if (isVideoFile(file)) {
            const video = document.createElement('video');
            video.src = filePath;
            video.className = 'file-preview';
            video.controls = true;
            fileItem.appendChild(video);
        } else {
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.textContent = getFileIcon(file);
            fileItem.appendChild(icon);
        }

        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file;
        fileItem.appendChild(fileName);

        fileItem.addEventListener('click', () => {
            openModalPreview(file, filePath, category);
        });

        return fileItem;
    }

    // Модальное окно предпросмотра
    function openModalPreview(file, filePath, category) {
        const modal = document.getElementById('modalOverlay');
        modal.innerHTML = '';
        modal.style.display = 'flex';
        modal.style.position = 'fixed';
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.background = 'rgba(0,0,0,0.92)';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = 9999;
        modal.style.flexDirection = 'column';
        modal.style.transition = 'opacity 0.2s';

        // Кнопка закрытия (крестик)
        const closeBtn = document.createElement('div');
        closeBtn.textContent = '✕';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '24px';
        closeBtn.style.right = '32px';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '2.5em';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.userSelect = 'none';
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
        modal.appendChild(closeBtn);

        // Кнопка загрузки (иконка)
        const downloadBtn = document.createElement('a');
        downloadBtn.href = filePath;
        downloadBtn.download = file;
        downloadBtn.target = '_blank';
        downloadBtn.style.position = 'absolute';
        downloadBtn.style.top = '24px';
        downloadBtn.style.left = '32px';
        downloadBtn.style.color = 'white';
        downloadBtn.style.fontSize = '2.2em';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.userSelect = 'none';
        downloadBtn.title = 'Download';
        downloadBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
        modal.appendChild(downloadBtn);

        // Контент предпросмотра
        const content = document.createElement('div');
        content.style.maxWidth = '90vw';
        content.style.maxHeight = '80vh';
        content.style.display = 'flex';
        content.style.alignItems = 'center';
        content.style.justifyContent = 'center';
        content.style.flexDirection = 'column';

        if (isImageFile(file)) {
            const img = document.createElement('img');
            img.src = filePath;
            img.style.maxWidth = '90vw';
            img.style.maxHeight = '80vh';
            img.style.borderRadius = '8px';
            content.appendChild(img);
        } else if (isVideoFile(file)) {
            const video = document.createElement('video');
            video.src = filePath;
            video.controls = true;
            video.autoplay = true;
            video.style.maxWidth = '90vw';
            video.style.maxHeight = '80vh';
            video.style.borderRadius = '8px';
            content.appendChild(video);
        } else {
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.textContent = getFileIcon(file);
            icon.style.fontSize = '5em';
            icon.style.marginBottom = '1em';
            content.appendChild(icon);
            const docName = document.createElement('div');
            docName.style.color = 'white';
            docName.style.fontSize = '1.1em';
            docName.style.marginBottom = '1em';
            docName.textContent = file;
            content.appendChild(docName);
        }

        modal.appendChild(content);
    }

    function setViewMode(mode) {
        currentViewMode = mode;
        document.querySelectorAll('.file-grid').forEach(grid => {
            grid.className = 'file-grid';
            grid.classList.add(mode);
        });
        // Обновить активные кнопки
        document.querySelectorAll('.view-mode-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.view-mode-btn[data-mode="' + mode + '"]')
            .forEach(btn => btn.classList.add('active'));
    }

    function displayFiles(files) {
        filesContainer.innerHTML = '';
        
        for (const [date, categories] of Object.entries(files)) {
            const dateSection = document.createElement('div');
            dateSection.className = 'date-section';
            
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            
            const dateText = document.createElement('span');
            dateText.textContent = date.replace(/_/g, '-');
            dateHeader.appendChild(dateText);

            // Add view mode buttons
            const viewModes = document.createElement('div');
            viewModes.className = 'view-modes';
            
            const listViewBtn = document.createElement('button');
            listViewBtn.className = 'view-mode-btn';
            listViewBtn.setAttribute('data-mode', 'list-view');
            listViewBtn.innerHTML = '<i class="fas fa-list"></i>';
            listViewBtn.title = 'Список';
            
            const smallIconsBtn = document.createElement('button');
            smallIconsBtn.className = 'view-mode-btn';
            smallIconsBtn.setAttribute('data-mode', 'small-icons-view');
            smallIconsBtn.innerHTML = '<i class="fas fa-th"></i>';
            smallIconsBtn.title = 'Мелкие значки';
            
            const largeIconsBtn = document.createElement('button');
            largeIconsBtn.className = 'view-mode-btn';
            largeIconsBtn.setAttribute('data-mode', 'large-icons-view');
            largeIconsBtn.innerHTML = '<i class="fas fa-th-large"></i>';
            largeIconsBtn.title = 'Крупные значки';

            viewModes.appendChild(listViewBtn);
            viewModes.appendChild(smallIconsBtn);
            viewModes.appendChild(largeIconsBtn);
            dateHeader.appendChild(viewModes);
            
            dateSection.appendChild(dateHeader);

            for (const [category, fileList] of Object.entries(categories)) {
                if (fileList && fileList.length > 0) {
                    const categorySection = document.createElement('div');
                    categorySection.className = 'category-section';
                    
                    const categoryHeader = document.createElement('div');
                    categoryHeader.className = 'category-header';
                    categoryHeader.textContent = category;
                    categorySection.appendChild(categoryHeader);

                    const fileGrid = document.createElement('div');
                    fileGrid.className = 'file-grid ' + currentViewMode;

                    fileList.forEach(file => {
                        fileGrid.appendChild(createFilePreview(file, date, category));
                    });

                    categorySection.appendChild(fileGrid);
                    dateSection.appendChild(categorySection);
                }
            }

            filesContainer.appendChild(dateSection);

            // Назначить обработчики после добавления в DOM
            listViewBtn.onclick = () => setViewMode('list-view');
            smallIconsBtn.onclick = () => setViewMode('small-icons-view');
            largeIconsBtn.onclick = () => setViewMode('large-icons-view');
        }
        // После отрисовки, выделить активную кнопку
        document.querySelectorAll('.view-mode-btn[data-mode="' + currentViewMode + '"]')
            .forEach(btn => btn.classList.add('active'));
    }

    function refreshFiles() {
        fetch('/list-uploads')
            .then(response => response.json())
            .then(files => {
                displayFiles(files);
            })
            .catch(error => {
                console.error('Error fetching files:', error);
            });
    }

    chooseBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*';
        
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            uploadFiles(files);
        };
        
        input.click();
    });

    function uploadFiles(files) {
        uploadProgress.style.display = 'block';
        let uploaded = 0;

        files.forEach((file, index) => {
            const formData = new FormData();
            formData.append('file', file);

            fetch('/', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (response.ok) {
                    uploaded++;
                    const progress = (uploaded / files.length) * 100;
                    progressBar.style.width = `${progress}%`;
                    uploadStatus.textContent = `Uploading... ${uploaded}/${files.length}`;

                    if (uploaded === files.length) {
                        setTimeout(() => {
                            uploadProgress.style.display = 'none';
                            progressBar.style.width = '0%';
                            refreshFiles();
                        }, 1000);
                    }
                }
            })
            .catch(error => {
                console.error('Error uploading file:', error);
            });
        });
    }

    refreshBtn.addEventListener('click', refreshFiles);

    // Initial load
    refreshFiles();
});

const langSelect = document.getElementById("language");

function applyTranslations(lang) {
  const t = translations[lang] || translations["en"];
  document.getElementById("mainTitle").textContent = t.welcome;
  document.getElementById("mainDescription").innerHTML = t.description;
  document.getElementById("langLabel").textContent = t.chooseLanguage || "Choose language:";
  document.getElementById("step1").textContent = t.step1;
  document.getElementById("step2").textContent = t.step2;
  document.getElementById("step3").childNodes[0].textContent = t.step3 + " ";
  document.getElementById("uploadsInfo").innerHTML = t.uploadsInfo || "";
  document.getElementById("chooseBtn").textContent = t.chooseFiles;
  document.getElementById("refreshBtn").textContent = t.refreshFiles;
  document.getElementById("uploadStatus").textContent = t.uploading || "";
  document.getElementById("footer").textContent = t.developedBy;
  document.getElementById("downloadBtn").textContent = t.download || "Download";
  document.getElementById("insecureWarning").textContent = t.insecureWarning;
  document.getElementById("privacyNote").textContent = t.privacyNote;
}

langSelect.onchange = () => {
  const selectedLang = langSelect.value;
  applyTranslations(selectedLang);
  localStorage.setItem("lang", selectedLang);
};

window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("lang") || "en";
  langSelect.value = savedLang;
  applyTranslations(savedLang);
});

