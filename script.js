// Kopyalama ve bildirim için fonksiyonlar (Değişiklik yok)
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
    event.stopPropagation();
    const urlToCopy = `${window.location.origin}${window.location.pathname.replace('index.html', '')}#/${id}`;
    navigator.clipboard.writeText(urlToCopy).then(showCopyNotification).catch(err => console.error('URL kopyalanamadı: ', err));
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
    const allMarkers = {};
    let allData = []; // Tüm veriyi burada saklayacağız

    // --- YENİ: Direkt Arama Fonksiyonu ---
    function directSearch(query) {
        const lowerCaseQuery = query.toLowerCase().trim();
        if (!lowerCaseQuery) return [];

        return allData.filter(item => {
            const titleMatch = item.title.toLowerCase().includes(lowerCaseQuery);
            const descMatch = item.description.toLowerCase().includes(lowerCaseQuery);
            const idMatch = item.id.toString() === lowerCaseQuery;
            return titleMatch || descMatch || idMatch;
        });
    }

    // --- YENİ: Tam Ekran Kontrolü ---
    L.Control.Fullscreen = L.Control.extend({
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom leaflet-control-fullscreen');
            const link = L.DomUtil.create('a', 'fullscreen-icon fullscreen-enter', container);
            link.href = '#';
            link.title = 'Tam Ekran';

            L.DomEvent.on(link, 'click', L.DomEvent.stop)
                      .on(link, 'click', this._toggleFullscreen, this);
            
            document.addEventListener('fullscreenchange', () => this._updateIcon(link));
            return container;
        },
        _toggleFullscreen: function() {
            if (!document.fullscreenElement) {
                map.getContainer().requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        },
        _updateIcon: function(link) {
            if (!document.fullscreenElement) {
                link.classList.remove('fullscreen-exit');
                link.classList.add('fullscreen-enter');
                link.title = 'Tam Ekran';
            } else {
                link.classList.remove('fullscreen-enter');
                link.classList.add('fullscreen-exit');
                link.title = 'Tam Ekrandan Çık';
            }
        }
    });
    L.control.fullscreen = (opts) => new L.Control.Fullscreen(opts);
    L.control.fullscreen({ position: 'topright' }).addTo(map);

    // --- YENİ: Haritaya Entegre Arama Kontrolü ---
    L.Control.Search = L.Control.extend({
        onAdd: function(map) {
            this._container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            this._button = L.DomUtil.create('a', 'leaflet-control-search', this._container);
            this._button.innerHTML = '<span class="search-icon">🔍</span>';
            this._button.href = '#';
            this._button.title = 'Ara';
            
            this._form = L.DomUtil.create('div', 'leaflet-control-search-expanded', this._container);
            this._input = L.DomUtil.create('input', 'search-input', this._form);
            this._input.type = 'text';
            this._input.placeholder = 'Ara...';
            this._results = L.DomUtil.create('div', 'search-results', this._form);

            L.DomEvent.on(this._button, 'click', L.DomEvent.stop).on(this._button, 'click', this._toggle, this);
            L.DomEvent.on(this._input, 'input', this._search, this);
            L.DomEvent.on(this._form, 'click', L.DomEvent.stop);

            L.DomUtil.addClass(this._form, 'leaflet-hidden');
            return this._container;
        },
        _toggle: function() {
            if (L.DomUtil.hasClass(this._form, 'leaflet-hidden')) {
                L.DomUtil.removeClass(this._form, 'leaflet-hidden');
                this._input.focus();
            } else {
                this._hide();
            }
        },
        _hide: function() {
            this._input.value = '';
            this._results.innerHTML = '';
            L.DomUtil.addClass(this._form, 'leaflet-hidden');
        },
        _search: function() {
            const query = this._input.value;
            const results = directSearch(query);
            this._displayResults(results);
        },
        _displayResults: function(results) {
            this._results.innerHTML = '';
            if (results.length > 0) {
                results.slice(0, 10).forEach(item => {
                    const el = L.DomUtil.create('div', 'result-item', this._results);
                    el.innerHTML = `<strong>${item.title}</strong><span>${item.description}</span>`;
                    L.DomEvent.on(el, 'click', () => {
                        goToMarker(item.id);
                        this._hide();
                    });
                });
            }
        }
    });
    L.control.search = (opts) => new L.Control.Search(opts);
    L.control.search({ position: 'topright' }).addTo(map);

    // --- Genel Fonksiyonlar (Marker vb.) ---
    function goToMarker(id) {
        const marker = allMarkers[id];
        if (marker) {
            map.setView(marker.getLatLng(), 17);
            marker.openPopup();
        }
    }

    function createPopupContent(item) {
        const imageUrl = item.image && (item.image.startsWith('http') ? item.image : `images/${item.image}`);
        const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${item.title}" loading="lazy">` : '';
        const sourceHtml = item.source ? (item.source.startsWith('http') ? `<p><strong><a href="${item.source}" target="_blank" rel="noopener noreferrer">Kaynak</a></strong></p>` : `<p><strong>Kaynak:</strong> ${item.source}</p>`) : '';
        const contributorHtml = item.contributor ? `<p><strong>Ekleyen:</strong> ${item.contributor}</p>` : '';
        const shareHtml = `<p class="share-link-container"><strong>Paylaş: <a href="#" onclick="copyShareLink(event, '${item.id}')" title="Bu yerin linkini kopyala">🔗</a></strong></p>`;
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;
        const directionsHtml = `<p class="share-link-container"><strong>Yol Tarifi: <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" title="Google Haritalar'da yol tarifi al">🧭</a></strong></p>`;
        return `${imageHtml}<div class="popup-text-content"><h3>${item.title}</h3><p>${item.description}</p>${sourceHtml}${contributorHtml}${shareHtml}${directionsHtml}</div>`;
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
        openMarkerFromUrl();
    }

    function openMarkerFromUrl() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#/')) {
            const idToOpen = hash.substring(2);
            goToMarker(idToOpen);
        }
    }

    fetch('markers.json')
        .then(response => response.json())
        .then(data => {
            allData = data; // Veriyi global değişkene ata
            addMarkers(data);
        })
        .catch(error => {
            console.error('Veri çekilirken bir hata oluştu:', error);
            alert('Harita verileri yüklenirken bir sorun oluştu.');
        });
});
