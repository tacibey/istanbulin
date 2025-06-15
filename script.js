document.addEventListener('DOMContentLoaded', () => {

    // --- ADIM 1: ÖNCE SADECE HARİTAYI ÇİZ ---
    const map = L.map('map', { attributionControl: false }).setView([41.0082, 28.9784], 13);
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
    
    const savedTheme = localStorage.getItem('mapTheme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);

    // --- ADIM 2: GERİ KALAN HER ŞEYİ GECİKMELİ YÜKLE ---
    function initializeHeavyContent() {
        
        function showCopyNotification(text = "URL Kopyalandı!") {
            const e = document.getElementById("copy-notification");
            e && e.remove();
            const t = document.createElement("div");
            t.id = "copy-notification", t.textContent = text, document.body.appendChild(t), setTimeout(() => {t.classList.add("show")}, 10), setTimeout(() => {t.classList.remove("show"), setTimeout(() => {t.remove()}, 300)}, 2e3)
        }
        function copyShareLink(e, t) {
            e.preventDefault(), e.stopPropagation();
            const o = `${window.location.origin}${window.location.pathname.replace("index.html","")}#/${t}`;
            navigator.clipboard.writeText(o).then(() => showCopyNotification()).catch(e => {console.error("URL kopyalanamadı: ", e)})
        }
        window.copyShareLink = copyShareLink;

        function setupSiteShare() {
            const shareButton = document.getElementById('site-share-button');
            const sharePopup = document.getElementById('site-share-popup');
            const shareOptions = document.querySelectorAll('.share-option');

            if (!shareButton || !sharePopup) return;
            
            const shareText = 'İstanbul İnteraktif Kültür Atlası "istanbulin" yayında. Teşrif etmez miydiniz? ⓘ https://istanbulin.org';
            const shareUrl = 'https://istanbulin.org';
            const encodedShareText = encodeURIComponent(shareText);

            const shareLinks = {
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                twitter: `https://twitter.com/intent/tweet?text=${encodedShareText}`,
                whatsapp: `https://api.whatsapp.com/send?text=${encodedShareText}`,
            };

            shareButton.addEventListener('click', (e) => {
                e.stopPropagation();
                sharePopup.classList.toggle('visible');
            });

            document.addEventListener('click', () => {
                sharePopup.classList.remove('visible');
            });

            sharePopup.addEventListener('click', (e) => {
                e.stopPropagation(); 
            });

            shareOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const platform = option.dataset.platform;
                    if (platform === 'copy') {
                        navigator.clipboard.writeText(shareUrl)
                            .then(() => showCopyNotification("Link kopyalandı!"))
                            .catch(err => console.error('Link kopyalanamadı: ', err));
                    } else {
                        window.open(shareLinks[platform], '_blank', 'noopener,noreferrer');
                    }
                    sharePopup.classList.remove('visible');
                });
            });
        }
        setupSiteShare();

        const copyrightElement = document.getElementById('copyright-text');
        if (copyrightElement) {
            copyrightElement.innerHTML = `© ${new Date().getFullYear()} istanbulin. <a href="https://tally.so/r/mYKvZ6" target="_blank" rel="noopener noreferrer" title="İletişim">✉️</a>`;
        }

        function setupPWA() {
            if (!('serviceWorker' in navigator)) return;
            navigator.serviceWorker.register('/sw.js').then(()=>console.log("ServiceWorker başarıyla kaydedildi.")).catch(e=>console.log("ServiceWorker kaydı başarısız:",e));
            const installButton=document.getElementById("install-button");let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; if (installButton) installButton.classList.add('visible'); });
            if(installButton) installButton.addEventListener('click', async () => { if (!deferredPrompt) return; installButton.classList.remove('visible'); deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; });
            window.addEventListener('appinstalled', () => { deferredPrompt = null; if (installButton) installButton.classList.remove('visible'); });
        }
        setupPWA();

        themeToggleButton.addEventListener('click', () => {
            const currentTheme = localStorage.getItem('mapTheme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            applyTheme(newTheme);
        });

        L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | CartoDB' }).addTo(map);
        L.control.locate({ position: 'topleft', setView: 'once', flyTo: true, strings: { title: "Mevcut Konumumu Göster" } }).addTo(map);
        const storage = { get: e=>{try{const t=localStorage.getItem(e);return t?JSON.parse(t):[]}catch(e){return console.error("LocalStorage okunamadı:",e),[]}}, set:(e,t)=>{try{localStorage.setItem(e,JSON.stringify(t))}catch(e){console.error("LocalStorage'a yazılamadı:",e)}}};
        let readMarkers = new Set(storage.get('readMarkers'));
        function markAsRead(e) { if (!readMarkers.has(e.toString())) { readMarkers.add(e.toString()); storage.set('readMarkers', Array.from(readMarkers)); } }
        
        const markersLayer = L.markerClusterGroup();
        map.addLayer(markersLayer);

        const allMarkers = {};
        let allData = [];
        function directSearch(e) { const t=e.toLowerCase().trim();return t?allData.filter(e=>e.title.toLowerCase().includes(t)||e.description.toLowerCase().includes(t)||e.id.toString()===t):[]}
        L.Control.Fullscreen = L.Control.extend({onAdd:function(e){const t=L.DomUtil.create("div","leaflet-bar leaflet-control leaflet-control-custom leaflet-control-fullscreen");return this._link=L.DomUtil.create("a","fullscreen-icon fullscreen-enter",t),this._link.href="#",this._link.title="Tam Ekran",L.DomEvent.on(this._link,"click",L.DomEvent.stop).on(this._link,"click",this._toggleFullscreen,this),t},_toggleFullscreen:function(){document.body.classList.toggle("map-is-fullscreen")},_updateIcon:function(){if(document.body.classList.contains("map-is-fullscreen")){this._link.classList.remove("fullscreen-enter"),this._link.classList.add("fullscreen-exit"),this._link.title="Tam Ekrandan Çık"}else{this._link.classList.remove("fullscreen-exit"),this._link.classList.add("fullscreen-enter"),this._link.title="Tam Ekran"}}});
        L.control.fullscreen = (e => new L.Control.Fullscreen(e));
        L.control.fullscreen({ position: 'topright' }).addTo(map);
        L.Control.Search = L.Control.extend({onAdd:function(e){return this._container=L.DomUtil.create("div","leaflet-bar leaflet-control leaflet-control-custom"),this._button=L.DomUtil.create("a","leaflet-control-search",this._container),this._button.innerHTML='<span class="search-icon">🔎</span>',this._button.href="#",this._button.title="Ara",this._form=L.DomUtil.create("div","leaflet-control-search-expanded",this._container),this._input=L.DomUtil.create("input","search-input",this._form),this._input.type="text",this._input.placeholder="Ara...",this._results=L.DomUtil.create("div","search-results",this._form),L.DomUtil.addClass(this._form,"leaflet-hidden"),L.DomEvent.on(this._button,"click",L.DomEvent.stop).on(this._button,"click",this._toggle,this),L.DomEvent.on(this._input,"input",this._search,this),L.DomEvent.on(this._form,"click",L.DomEvent.stop),L.DomEvent.on(e,"click",this._hide,this),this._container},_toggle:function(){L.DomUtil.hasClass(this._form,"leaflet-hidden")?(L.DomUtil.removeClass(this._form,"leaflet-hidden"),this._input.focus()):this._hide()},_hide:function(){this._input.value="",this._results.innerHTML="",L.DomUtil.addClass(this._form,"leaflet-hidden")},_search:function(){const e=this._input.value,t=directSearch(e);this._displayResults(t)},_displayResults:function(e){this._results.innerHTML="",e.length>0&&this._input.value&&e.slice(0,10).forEach(e=>{const t=L.DomUtil.create("div","result-item",this._results);t.textContent=e.title,L.DomEvent.on(t,"click",()=>{goToMarker(e.id),this._hide()})})}});
        L.control.search = (e => new L.Control.Search(e));
        L.control.search({ position: 'topright' }).addTo(map);

        function goToMarker(id) {
            const marker = allMarkers[id];
            if (!marker) return;

            markersLayer.zoomToShowLayer(marker, () => {
                const offset = map.getSize().y * -0.25; 
                map.panBy([0, offset], { animate: true });
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
            const directionsHtml = `<p class="action-link"><strong>Yol Tarifi:</strong><a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" title="Google Haritalar'da yol tarifi al">🗺️</a></p>`;
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

        function addMarkers(data) {
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
                        markAsRead(markerData.id);
                        marker.setIcon(L.divIcon({
                            className: "custom-marker-icon",
                            html: "i",
                            iconSize: [30, 30],
                            iconAnchor: [15, 30],
                            popupAnchor: [0, -25]
                        }));
                    }
                    window.location.hash = `/${markerData.id}`;
                });

                marker.bindPopup(() => createPopupContent(markerData), { minWidth: 300 });
                markersLayer.addLayer(marker);
                allMarkers[markerData.id] = marker;
            });
            openMarkerFromUrl();
        }

        function openMarkerFromUrl() {
            const hash = window.location.hash;
            if (hash && hash.startsWith("#/")) {
                goToMarker(hash.substring(2));
            }
        }

        function setupShuffle() {
            const shuffleButton = document.getElementById('shuffle-button');
            if (!shuffleButton) return;

            shuffleButton.addEventListener('click', () => {
                if (allData.length === 0) return;

                const allIds = allData.map(m => m.id.toString());
                const readIds = new Set(storage.get('readMarkers'));

                let unreadIds = allIds.filter(id => !readIds.has(id));
                
                if (unreadIds.length === 0) {
                    unreadIds = allIds;
                }

                const randomId = unreadIds[Math.floor(Math.random() * unreadIds.length)];
                goToMarker(randomId);
                window.location.hash = `/${randomId}`;
            });
        }

        fetch('markers.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                allData = data;
                addMarkers(data);
                setupShuffle();
            })
            .catch(error => {
                console.error("Veri çekilirken bir hata oluştu:", error);
                alert("Harita verileri yüklenirken bir sorun oluştu. Lütfen sayfayı yenileyin.");
            });

        window.addEventListener('hashchange', openMarkerFromUrl, false);
    }
    
    // Tarayıcı bir sonraki boyama fırsatında ağır işlemleri başlat.
    requestAnimationFrame(initializeHeavyContent);

});
