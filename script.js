function showCopyNotification() {
    const e = document.getElementById("copy-notification");
    e && e.remove();
    const t = document.createElement("div");
    t.id = "copy-notification", t.textContent = "URL Kopyalandı!", document.body.appendChild(t), setTimeout(() => {
        t.classList.add("show")
    }, 10), setTimeout(() => {
        t.classList.remove("show"), setTimeout(() => {
            t.remove()
        }, 300)
    }, 2e3)
}
function copyShareLink(e, t) {
    e.preventDefault(), e.stopPropagation();
    const o = `${window.location.origin}${window.location.pathname.replace("index.html","")}#/${t}`;
    navigator.clipboard.writeText(o).then(showCopyNotification).catch(e => {
        console.error("URL kopyalanamadı: ", e)
    })
}
function urlBase64ToUint8Array(t) {
    const e = "=".repeat((4 - t.length % 4) % 4),
        r = (t + e).replace(/-/g, "+").replace(/_/g, "/"),
        o = window.atob(r),
        n = new Uint8Array(o.length);
    for (let e = 0; e < o.length; ++e) n[e] = o.charCodeAt(e);
    return n
}
document.addEventListener('DOMContentLoaded', () => {
    // SADELEŞTİRİLMİŞ PWA KURULUMU (Sadece Telefona Ekle)
    function setupPWA() {
        if (!('serviceWorker' in navigator)) return;

        navigator.serviceWorker.register('/sw.js')
            .then(() => console.log('Akıllı ServiceWorker başarıyla kaydedildi.'))
            .catch(err => console.log('ServiceWorker kaydı başarısız:', err));

        const installButton = document.getElementById('install-button');
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Sadece install butonu varsa göster
            if (installButton) {
                installButton.classList.add('visible');
            }
        });

        if (installButton) {
            installButton.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                installButton.classList.remove('visible');
                deferredPrompt.prompt();
                await deferredPrompt.userChoice;
                deferredPrompt = null;
            });
        }

        window.addEventListener('appinstalled', () => {
            deferredPrompt = null;
            if (installButton) {
                installButton.classList.remove('visible');
            }
        });
    }
    setupPWA();

    const copyrightElement = document.getElementById('copyright-text');
    if (copyrightElement) {
        copyrightElement.innerHTML = `© ${new Date().getFullYear()} istanbulin. <a href="https://tally.so/r/mYKvZ6" target="_blank" rel="noopener noreferrer" class="footer-contact-link" title="İletişim">📩</a>`;
    }
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    const storage = {
        get: e => {
            try {
                const t = localStorage.getItem(e);
                return t ? JSON.parse(t) : []
            } catch (e) {
                return console.error("LocalStorage okunamadı:", e), []
            }
        },
        set: (e, t) => {
            try {
                localStorage.setItem(e, JSON.stringify(t))
            } catch (e) {
                console.error("LocalStorage'a yazılamadı:", e)
            }
        }
    };
    let readMarkers = new Set(storage.get('readMarkers'));

    function markAsRead(e) {
        if (!readMarkers.has(e.toString())) {
            readMarkers.add(e.toString());
            storage.set('readMarkers', Array.from(readMarkers));
        }
    }
    const map = L.map('map', {
        attributionControl: false
    }).setView([41.0082, 28.9784], 13);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 19,
        noWrap: true
    }).addTo(map);
    L.control.attribution({
        position: 'bottomright',
        prefix: 'Leaflet | Esri'
    }).addTo(map);
    L.control.locate({
        position: 'topleft',
        setView: 'once',
        flyTo: true,
        strings: {
            title: "Mevcut Konumumu Göster"
        }
    }).addTo(map);
    const markersLayer = L.markerClusterGroup();
    const allMarkers = {};
    let allData = [];

    function directSearch(e) {
        const t = e.toLowerCase().trim();
        return t ? allData.filter(e => e.title.toLowerCase().includes(t) || e.description.toLowerCase().includes(t) || e.id.toString() === t) : []
    }
    L.Control.Fullscreen = L.Control.extend({
        onAdd: function(e) {
            const t = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom leaflet-control-fullscreen");
            this._link = L.DomUtil.create("a", "fullscreen-icon fullscreen-enter", t);
            this._link.href = "#";
            this._link.title = "Tam Ekran";
            L.DomEvent.on(this._link, "click", L.DomEvent.stop).on(this._link, "click", this._toggleFullscreen, this);
            return t
        },
        _toggleFullscreen: function() {
            document.body.classList.toggle("map-is-fullscreen");
            this._updateIcon();
            setTimeout(() => map.invalidateSize(), 300)
        },
        _updateIcon: function() {
            if (document.body.classList.contains("map-is-fullscreen")) {
                this._link.classList.remove("fullscreen-enter");
                this._link.classList.add("fullscreen-exit");
                this._link.title = "Tam Ekrandan Çık";
            } else {
                this._link.classList.remove("fullscreen-exit");
                this._link.classList.add("fullscreen-enter");
                this._link.title = "Tam Ekran";
            }
        }
    });
    L.control.fullscreen = (e => new L.Control.Fullscreen(e));
    L.control.fullscreen({
        position: 'topright'
    }).addTo(map);
    L.Control.Search = L.Control.extend({
        onAdd: function(e) {
            this._container = L.DomUtil.create("div", "leaflet-bar leaflet-control leaflet-control-custom");
            this._button = L.DomUtil.create("a", "leaflet-control-search", this._container);
            this._button.innerHTML = '<span class="search-icon">🔍</span>';
            this._button.href = "#";
            this._button.title = "Ara";
            this._form = L.DomUtil.create("div", "leaflet-control-search-expanded", this._container);
            this._input = L.DomUtil.create("input", "search-input", this._form);
            this._input.type = "text";
            this._input.placeholder = "Ara...";
            this._results = L.DomUtil.create("div", "search-results", this._form);
            L.DomUtil.addClass(this._form, "leaflet-hidden");
            L.DomEvent.on(this._button, "click", L.DomEvent.stop).on(this._button, "click", this._toggle, this);
            L.DomEvent.on(this._input, "input", this._search, this);
            L.DomEvent.on(this._form, "click", L.DomEvent.stop);
            L.DomEvent.on(e, "click", this._hide, this);
            return this._container
        },
        _toggle: function() {
            if (L.DomUtil.hasClass(this._form, "leaflet-hidden")) {
                L.DomUtil.removeClass(this._form, "leaflet-hidden");
                this._input.focus();
            } else {
                this._hide();
            }
        },
        _hide: function() {
            this._input.value = "";
            this._results.innerHTML = "";
            L.DomUtil.addClass(this._form, "leaflet-hidden");
        },
        _search: function() {
            const e = this._input.value;
            const t = directSearch(e);
            this._displayResults(t);
        },
        _displayResults: function(e) {
            this._results.innerHTML = "";
            if (e.length > 0 && this._input.value) {
                e.slice(0, 10).forEach(e => {
                    const t = L.DomUtil.create("div", "result-item", this._results);
                    t.textContent = e.title;
                    L.DomEvent.on(t, "click", () => {
                        goToMarker(e.id);
                        this._hide();
                    });
                });
            }
        }
    });
    L.control.search = (e => new L.Control.Search(e));
    L.control.search({
        position: 'topright'
    }).addTo(map);

    function goToMarker(e) {
        const t = allMarkers[e];
        if (t) {
            map.setView(t.getLatLng(), 17);
            t.openPopup();
        }
    }

    function createPopupContent(e) {
        const t = e.image && (e.image.startsWith('http') ? e.image : `images/${e.image}`);
        const o = t ? `<img src="${t}" alt="${e.title}" loading="lazy">` : '';
        const n = e.source ? (e.source.startsWith('http') ? `<p><strong><a href="${e.source}" target="_blank" rel="noopener noreferrer">Kaynak</a></strong></p>` : `<p><strong>Kaynak:</strong> ${e.source}</p>`) : '';
        const i = e.contributor ? `<p><strong>Ekleyen:</strong> ${e.contributor}</p>` : '';
        const a = `<p class="share-link-container"><strong>Paylaş: <a href="#" onclick="copyShareLink(event, '${e.id}')" title="Bu yerin linkini kopyala">🔗</a></strong></p>`;
        const s = `https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`;
        const r = `<p class="share-link-container"><strong>Yol Tarifi: <a href="${s}" target="_blank" rel="noopener noreferrer" title="Google Haritalar'da yol tarifi al">🧭</a></strong></p>`;
        return `${o}<div class="popup-text-content"><h3>${e.title}</h3><p>${e.description}</p>${n}${i}${a}${r}</div>`
    }

    function addMarkers(e) {
        const t = new Set(storage.get('lastSeenMarkers'));
        e.forEach(e => {
            const o = !readMarkers.has(e.id.toString());
            const n = L.divIcon({
                className: o ? "custom-marker-icon new-marker" : "custom-marker-icon",
                html: 'i',
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -25]
            });
            const i = L.marker([e.lat, e.lng], {
                icon: n
            });
            i.on('click', () => {
                if (o) {
                    markAsRead(e.id);
                    i.setIcon(L.divIcon({
                        className: 'custom-marker-icon',
                        html: 'i',
                        iconSize: [30, 30],
                        iconAnchor: [15, 30],
                        popupAnchor: [0, -25]
                    }));
                }
                window.location.hash = `/${e.id}`;
            });
            i.bindPopup(() => createPopupContent(e), {
                minWidth: 300
            });
            markersLayer.addLayer(i);
            allMarkers[e.id] = i;
        });
        map.addLayer(markersLayer);
        openMarkerFromUrl();
        const o = e.map(e => e.id);
        storage.set('lastSeenMarkers', o);
    }

    function openMarkerFromUrl() {
        const e = window.location.hash;
        if (e && e.startsWith('#/')) {
            goToMarker(e.substring(2));
        }
    }
    fetch('markers.json').then(e => e.json()).then(e => {
        allData = e;
        addMarkers(e);
    }).catch(e => {
        console.error("Veri çekilirken bir hata oluştu:", e);
        alert("Harita verileri yüklenirken bir sorun oluştu.");
    })
});
