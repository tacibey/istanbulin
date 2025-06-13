document.addEventListener('DOMContentLoaded', () => {

    // --- GENEL YARDIMCI FONKSİYONLAR ---
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
    window.copyShareLink = copyShareLink; // HTML'den erişilebilir yapmak için

    // --- TEMEL KONTROLLER ve ELEMENTLER ---
    const copyrightElement = document.getElementById('copyright-text');
    if (copyrightElement) {
        copyrightElement.innerHTML = `© ${new Date().getFullYear()} istanbulin. <a href="https://tally.so/r/mYKvZ6" target="_blank" rel="noopener noreferrer" class="footer-contact-link" title="İletişim">📩</a>`;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // --- PWA KURULUMU ---
    function setupPWA() {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('/sw.js').then(() => console.log('Akıllı ServiceWorker başarıyla kaydedildi.')).catch(err => console.log('ServiceWorker kaydı başarısız:', err));
        const installButton = document.getElementById('install-button');
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            if (installButton) installButton.classList.add('visible');
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
            if (installButton) installButton.classList.remove('visible');
        });
    }
    setupPWA();


    // --- HARİTA KURULUMU ---
    const map = L.map('map', {
        attributionControl: false,
        layers: [] 
    }).setView([41.0082, 28.9784], 13);

    // --- TEMA YÖNETİMİ (Harita oluşturulduktan SONRA) ---
    const themeToggleButton = document.getElementById('theme-toggle-button');

    // DEĞİŞİKLİK: Her katman kendi doğru ayarlarıyla tanımlandı.
    const lightTheme = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 19, // Gündüz modu çok detaylı
        noWrap: true
    });
    
    const darkTheme = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, // Yine de 19'a kadar gitmesine izin ver (dijital zoom)
        maxNativeZoom: 19, // Ama gerçek resimlerin 16'da bittiğini söyle
        noWrap: true
    });

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
    
    themeToggleButton.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('mapTheme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
    });

    const savedTheme = localStorage.getItem('mapTheme') || 'light';
    applyTheme(savedTheme);


    // --- HARİTA KONTROLLERİ ve VERİ YÖNETİMİ ---
    L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | Esri' }).addTo(map);
    L.control.locate({ position: 'topleft', setView: 'once', flyTo: true, strings: { title: "Mevcut Konumumu Göster" } }).addTo(map);

    const storage = { get: e=>{try{const t=localStorage.getItem(e);return t?JSON.parse(t):[]}catch(e){return console.error("LocalStorage okunamadı:",e),[]}}, set:(e,t)=>{try{localStorage.setItem(e,JSON.stringify(t))}catch(e){console.error("LocalStorage'a yazılamadı:",e)}}};
    let readMarkers = new Set(storage.get('readMarkers'));
    function markAsRead(e) { if (!readMarkers.has(e.toString())) { readMarkers.add(e.toString()); storage.set('readMarkers', Array.from(readMarkers)); } }

    const markersLayer = L.markerClusterGroup();
    const allMarkers = {};
    let allData = [];

    function directSearch(e) { const t=e.toLowerCase().trim();return t?allData.filter(e=>e.title.toLowerCase().includes(t)||e.description.toLowerCase().includes(t)||e.id.toString()===t):[]}

    L.Control.Fullscreen = L.Control.extend({onAdd:function(e){const t=L.DomUtil.create("div","leaflet-bar leaflet-control leaflet-control-custom leaflet-control-fullscreen");return this._link=L.DomUtil.create("a","fullscreen-icon fullscreen-enter",t),this._link.href="#",this._link.title="Tam Ekran",L.DomEvent.on(this._link,"click",L.DomEvent.stop).on(this._link,"click",this._toggleFullscreen,this),t},_toggleFullscreen:function(){document.body.classList.toggle("map-is-fullscreen");this._updateIcon();setTimeout(()=>map.invalidateSize(),300)},_updateIcon:function(){document.body.classList.contains("map-is-fullscreen")?(this._link.classList.remove("fullscreen-enter"),this._link.classList.add("fullscreen-exit"),this._link.title="Tam Ekrandan Çık"):(this._link.classList.remove("fullscreen-exit"),this._link.classList.add("fullscreen-enter"),this._link.title="Tam Ekran")}});
    L.control.fullscreen = (e => new L.Control.Fullscreen(e));
    L.control.fullscreen({ position: 'topright' }).addTo(map);

    L.Control.Search = L.Control.extend({onAdd:function(e){return this._container=L.DomUtil.create("div","leaflet-bar leaflet-control leaflet-control-custom"),this._button=L.DomUtil.create("a","leaflet-control-search",this._container),this._button.innerHTML='<span class="search-icon">🔍</span>',this._button.href="#",this._button.title="Ara",this._form=L.DomUtil.create("div","leaflet-control-search-expanded",this._container),this._input=L.DomUtil.create("input","search-input",this._form),this._input.type="text",this._input.placeholder="Ara...",this._results=L.DomUtil.create("div","search-results",this._form),L.DomUtil.addClass(this._form,"leaflet-hidden"),L.DomEvent.on(this._button,"click",L.DomEvent.stop).on(this._button,"click",this._toggle,this),L.DomEvent.on(this._input,"input",this._search,this),L.DomEvent.on(this._form,"click",L.DomEvent.stop),L.DomEvent.on(e,"click",this._hide,this),this._container},_toggle:function(){L.DomUtil.hasClass(this._form,"leaflet-hidden")?(L.DomUtil.removeClass(this._form,"leaflet-hidden"),this._input.focus()):this._hide()},_hide:function(){this._input.value="",this._results.innerHTML="",L.DomUtil.addClass(this._form,"leaflet-hidden")},_search:function(){const e=this._input.value,t=directSearch(e);this._displayResults(t)},_displayResults:function(e){this._results.innerHTML="",e.length>0&&this._input.value&&e.slice(0,10).forEach(e=>{const t=L.DomUtil.create("div","result-item",this._results);t.textContent=e.title,L.DomEvent.on(t,"click",()=>{goToMarker(e.id),this._hide()})})}});
    L.control.search = (e => new L.Control.Search(e));
    L.control.search({ position: 'topright' }).addTo(map);

    function goToMarker(id) { const marker = allMarkers[id]; if (!marker) return; markersLayer.zoomToShowLayer(marker, () => { if (!map.hasLayer(marker)) map.setView(marker.getLatLng(), 17); marker.openPopup(); }); }

    function createPopupContent(e) { const t=e.image&&(e.image.startsWith("http")?e.image:`images/${e.image}`),o=t?`<img src="${t}" alt="${e.title}" loading="lazy">`:"",n=e.source?e.source.startsWith("http")?`<p><strong><a href="${e.source}" target="_blank" rel="noopener noreferrer">Kaynak</a></strong></p>`:`<p><strong>Kaynak:</strong> ${e.source}</p>`:"",i=e.contributor?`<p><strong>Ekleyen:</strong> ${e.contributor}</p>`:"",a=`<p class="share-link-container"><strong>Paylaş: <a href="#" onclick="copyShareLink(event, '${e.id}')" title="Bu yerin linkini kopyala">🔗</a></strong></p>`,s=`https://www.google.com/maps/dir/?api=1&destination=${e.lat},${e.lng}`,r=`<p class="share-link-container"><strong>Yol Tarifi: <a href="${s}" target="_blank" rel="noopener noreferrer" title="Google Haritalar'da yol tarifi al">🧭</a></strong></p>`;return`${o}<div class="popup-text-content"><h3>${e.title}</h3><p>${e.description}</p>${n}${i}${a}${r}</div>`}

    function addMarkers(e) {
        const t = new Set(storage.get('lastSeenMarkers'));
        e.forEach(e => {
            const o = !readMarkers.has(e.id.toString());
            const n = L.divIcon({ className: o ? "custom-marker-icon new-marker" : "custom-marker-icon", html: 'i', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -25] });
            const i = L.marker([e.lat, e.lng], { icon: n });
            i.on('click', () => {
                if (o) {
                    markAsRead(e.id);
                    i.setIcon(L.divIcon({ className: 'custom-marker-icon', html: 'i', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -25] }));
                }
                window.location.hash = `/${e.id}`;
            });
            i.bindPopup(() => createPopupContent(e), { minWidth: 300 });
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
