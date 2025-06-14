document.addEventListener('DOMContentLoaded', function () {

    // Helper Functions
    function showCopyNotification(text = "URL Kopyalandı!") {
        const existingNotification = document.getElementById("copy-notification");
        if (existingNotification) {
            existingNotification.remove();
        }
        const newNotification = document.createElement("div");
        newNotification.id = "copy-notification";
        newNotification.textContent = text;
        document.body.appendChild(newNotification);
        setTimeout(() => { newNotification.classList.add("show"); }, 10);
        setTimeout(() => {
            newNotification.classList.remove("show");
            setTimeout(() => { newNotification.remove(); }, 300);
        }, 2000);
    }

    window.copyShareLink = function (event, markerId) {
        event.preventDefault();
        event.stopPropagation();
        const url = `${window.location.origin}${window.location.pathname.replace("index.html","")}#/${markerId}`;
        navigator.clipboard.writeText(url).then(() => {
            showCopyNotification();
        }).catch(err => {
            console.error("URL kopyalanamadı:", err);
        });
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error("Harita elementi (#map) bulunamadı. Script sonlandırılıyor.");
        return;
    }

    // Basic Initializations
    const allMarkers = {};
    let allData = [];
    const map = L.map('map', {
        attributionControl: false,
        layers: []
    }).setView([41.0082, 28.9784], 13);
    const markersLayer = L.markerClusterGroup();
    const storage = {
        get: key => { try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : []; } catch (e) { console.error("LocalStorage okunamadı:", e); return []; } },
        set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("LocalStorage'a yazılamadı:", e); } }
    };
    let readMarkers = new Set(storage.get('readMarkers'));

    // Theme Handling
    const themeToggleButton = document.getElementById('theme-toggle-button');
    const lightTheme = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 20 });
    const darkTheme = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 });

    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
            if (map.hasLayer(lightTheme)) map.removeLayer(lightTheme);
            if (!map.hasLayer(darkTheme)) darkTheme.addTo(map);
        } else {
            document.body.classList.remove('dark-theme');
            if (map.hasLayer(darkTheme)) map.removeLayer(darkTheme);
            if (!map.hasLayer(lightTheme)) lightTheme.addTo(map);
        }
        localStorage.setItem('mapTheme', theme);
    }
    const savedTheme = localStorage.getItem('mapTheme') || 'light';
    applyTheme(savedTheme);
    themeToggleButton.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // PWA Setup
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log("ServiceWorker başarıyla kaydedildi."))
            .catch(e => console.error("ServiceWorker kaydı başarısız:", e));
    }
    
    // Core Map Logic
    function goToMarker(id) {
        const marker = allMarkers[id];
        if (!marker) return;

        markersLayer.zoomToShowLayer(marker, () => {
            // This is the stable positioning logic. It centers the marker.
            // The more complex `panBy` logic can be re-added later.
            marker.openPopup();
        });
    }

    function formatDescription(description) {
        return description.replace(/(“[^”]*”|"[^"]*")/g, '<i>$&</i>');
    }

    function createPopupContent(markerData) {
        let imageUrl = '';
        if (markerData.image) {
            if (markerData.image.startsWith('http')) {
                imageUrl = `https://images.weserv.nl/?url=${encodeURIComponent(markerData.image)}&w=300&h=200&fit=cover&output=webp`;
            } else {
                imageUrl = `images/${markerData.image}`;
            }
        }
        
        const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${markerData.title}" loading="lazy" onerror="this.style.display='none';">` : '';
        const sourceHtml = markerData.source ? (markerData.source.startsWith('http') ? `<p><strong><a href="${markerData.source}" target="_blank" rel="noopener noreferrer">Kaynak</a></strong></p>` : `<p><strong>Kaynak:</strong> ${markerData.source}</p>`) : '';
        const contributorHtml = markerData.contributor ? `<p><strong>Ekleyen:</strong> ${markerData.contributor}</p>` : '';
        const formattedDescription = formatDescription(markerData.description);
        
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${markerData.lat},${markerData.lng}`;
        const directionsHtml = `<p class="action-link"><strong>Yol Tarifi:</strong><a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" title="Google Haritalar'da yol tarifi al">🧭</a></p>`;
        const shareHtml = `<p class="action-link"><strong>Paylaş:</strong><a href="#" onclick="copyShareLink(event, '${markerData.id}')" title="Bu yerin linkini kopyala">🔗</a></p>`;

        return `
            ${imageHtml}
            <div class="popup-text-content">
                <h3>${markerData.title}</h3>
                <p>${formattedDescription}</p>
                ${sourceHtml}
                ${contributorHtml}
                <div class="popup-actions">
                    ${directionsHtml}
                    ${shareHtml}
                </div>
            </div>
        `;
    }

    function addMarkersToMap(data) {
        allData = data;
        data.forEach(markerData => {
            const isNew = !readMarkers.has(markerData.id.toString());
            const icon = L.divIcon({
                className: isNew ? "custom-marker-icon new-marker" : "custom-marker-icon",
                html: "i",
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -25]
            });

            const marker = L.marker([markerData.lat, markerData.lng], { icon: icon });
            
            marker.on("click", () => {
                if (isNew) {
                    readMarkers.add(markerData.id.toString());
                    storage.set('readMarkers', Array.from(readMarkers));
                    marker.setIcon(L.divIcon({ className: "custom-marker-icon", html: "i", iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -25] }));
                }
                window.location.hash = `/${markerData.id}`;
            });

            marker.bindPopup(() => createPopupContent(markerData), { minWidth: 300 });
            markersLayer.addLayer(marker);
            allMarkers[markerData.id] = marker;
        });
        map.addLayer(markersLayer);
        openMarkerFromUrl(); // Initial check on page load
    }

    function openMarkerFromUrl() {
        const hash = window.location.hash;
        if (hash && hash.startsWith("#/")) {
            const id = hash.substring(2);
            // Wait a moment for the map to be ready before trying to go to marker
            setTimeout(() => goToMarker(id), 100);
        }
    }
    
    // Fetch data and initialize
    fetch('markers.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            addMarkersToMap(data);
        })
        .catch(error => {
            console.error("Veri çekilirken bir hata oluştu:", error);
            alert("Harita verileri yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.");
        });
        
    // Event Listeners
    window.addEventListener('hashchange', openMarkerFromUrl, false);

    // Footer and other UI elements
    const copyrightElement = document.getElementById('copyright-text');
    if (copyrightElement) {
        copyrightElement.innerHTML = `© ${new Date().getFullYear()} istanbulin. <a href="https://tally.so/r/mYKvZ6" target="_blank" rel="noopener noreferrer" title="İletişim">✉️</a>`;
    }

});
