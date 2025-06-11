// Kopyalama ve bildirim için fonksiyonlar
function showCopyNotification() {
    const existingNotification = document.getElementById('copy-notification');
    if (existingNotification) existingNotification.remove();
    const notification = document.createElement('div');
    notification.id = 'copy-notification';
    notification.textContent = 'URL Kopyalandı!';
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

function copyShareLink(event, id) {
    event.preventDefault();
    event.stopPropagation(); // ÖNEMLİ: Popup'ın kapanmasını engelle
    const urlToCopy = `${window.location.origin}${window.location.pathname.replace('index.html', '')}#/${id}`;
    navigator.clipboard.writeText(urlToCopy).then(showCopyNotification).catch(err => {
        console.error('URL kopyalanamadı: ', err);
    });
}


document.addEventListener('DOMContentLoaded', () => {
    // --- Genel Ayarlar ---
    const copyrightElement = document.getElementById('copyright-text');
    if (copyrightElement) {
        copyrightElement.textContent = `© ${new Date().getFullYear()} istanbulin. Tüm Hakları Saklıdır.`;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // --- Harita Kurulumu ---
    const map = L.map('map', { attributionControl: false }).setView([41.0082, 28.9784], 13);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, maxNativeZoom: 19, noWrap: true
    }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | Esri' }).addTo(map);
    L.control.locate({ position: 'topleft', setView: 'once', flyTo: true, strings: { title: "Mevcut Konumumu Göster" } }).addTo(map);

    const customMarkerIcon = L.divIcon({
        className: 'custom-marker-icon', html: 'i', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -25]
    });
    
    const markersLayer = L.markerClusterGroup();
    const allMarkers = {}; // Tüm marker objelerini saklamak için

    // --- Arama Motoru Kurulumu ---
    let fuse;
    const searchInput = document.getElementById('search-input');
    const searchResultsContainer = document.getElementById('search-results');
    const searchContainer = document.getElementById('search-container');
    const searchToggleBtn = document.getElementById('search-toggle-btn');
    const searchClearBtn = document.getElementById('search-clear-btn');

    function setupSearch(data) {
        const options = {
            keys: ['title', 'description', 'id'],
            includeScore: true,
            threshold: 0.3,
            minMatchCharLength: 1
        };
        fuse = new Fuse(data, options);

        searchInput.addEventListener('input', handleSearch);
        searchToggleBtn.addEventListener('click', toggleSearch);
        searchClearBtn.addEventListener('click', clearSearch);
        document.addEventListener('click', (e) => { // Dışarı tıklayınca arama kutusunu kapat
            if (!searchContainer.contains(e.target) && !searchToggleBtn.contains(e.target)) {
                hideSearch();
            }
        });
    }

    function handleSearch(e) {
        const query = e.target.value;
        if (query.length > 0) {
            searchClearBtn.style.display = 'block';
        } else {
            searchClearBtn.style.display = 'none';
        }

        const results = fuse.search(query);
        displayResults(results);
    }

    function displayResults(results) {
        searchResultsContainer.innerHTML = '';
        if (results.length > 0) {
            searchResultsContainer.style.display = 'block';
            results.slice(0, 10).forEach(result => { // En iyi 10 sonucu göster
                const item = result.item;
                const resultElement = document.createElement('div');
                resultElement.className = 'result-item';
                resultElement.innerHTML = `<strong>${item.title}</strong><span>${item.description}</span>`;
                resultElement.addEventListener('click', () => {
                    goToMarker(item.id);
                    hideSearch();
                });
                searchResultsContainer.appendChild(resultElement);
            });
        } else {
            searchResultsContainer.style.display = 'none';
        }
    }
    
    function goToMarker(id) {
        const marker = allMarkers[id];
        if (marker) {
            map.setView(marker.getLatLng(), 17); // Daha yakın bir zoom seviyesi
            marker.openPopup();
        }
    }

    function toggleSearch() {
        searchContainer.classList.toggle('active');
        if (searchContainer.classList.contains('active')) {
            searchInput.focus();
            searchToggleBtn.innerHTML = '×'; // Kapatma ikonu
        } else {
            hideSearch(); // Hem gizler hem de içeriği temizler
        }
    }

    function hideSearch() {
        searchContainer.classList.remove('active');
        searchToggleBtn.innerHTML = '🔍';
        clearSearch();
    }
    
    function clearSearch() {
        searchInput.value = '';
        searchResultsContainer.innerHTML = '';
        searchResultsContainer.style.display = 'none';
        searchClearBtn.style.display = 'none';
    }


    // --- Veri Yükleme ve Haritayı Doldurma ---
    function createPopupContent(item) {
        const imageUrl = item.image && (item.image.startsWith('http') ? item.image : `images/${item.image}`);
        const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${item.title}" loading="lazy">` : '';
        const sourceHtml = item.source ? (item.source.startsWith('http') ? `<p><strong><a href="${item.source}" target="_blank" rel="noopener noreferrer">Kaynak</a></strong></p>` : `<p><strong>Kaynak:</strong> ${item.source}</p>`) : '';
        const contributorHtml = item.contributor ? `<p><strong>Ekleyen:</strong> ${item.contributor}</p>` : '';
        const shareHtml = `<p class="share-link-container"><strong>Paylaş: <a href="#" onclick="copyShareLink(event, '${item.id}')" title="Bu yerin linkini kopyala">🔗</a></strong></p>`;
        
        return `${imageHtml}<div class="popup-text-content"><h3>${item.title}</h3><p>${item.description}</p>${sourceHtml}${contributorHtml}${shareHtml}</div>`;
    }

    function addMarkers(data) {
        data.forEach(item => {
            const marker = L.marker([item.lat, item.lng], { icon: customMarkerIcon });
            marker.bindPopup(() => createPopupContent(item), { minWidth: 300 });
            marker.on('click', () => window.location.hash = `/${item.id}`);
            markersLayer.addLayer(marker);
            allMarkers[item.id] = marker;
        });
        map.addLayer(markersLayer);
        openMarkerFromUrl(); // URL'deki ID'ye göre marker aç
    }

    function openMarkerFromUrl() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#/')) {
            const idToOpen = hash.substring(2);
            const markerToOpen = allMarkers[idToOpen];
            if (markerToOpen) {
                map.whenReady(() => {
                    markersLayer.zoomToShowLayer(markerToOpen, () => markerToOpen.openPopup());
                });
            }
        }
    }

    fetch('markers.json')
        .then(response => response.json())
        .then(data => {
            addMarkers(data);
            setupSearch(data);
        })
        .catch(error => {
            console.error('Veri çekilirken bir hata oluştu:', error);
            alert('Harita verileri yüklenirken bir sorun oluştu.');
        });
});
