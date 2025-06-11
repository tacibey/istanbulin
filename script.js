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
    event.stopPropagation();
    const urlToCopy = `${window.location.origin}${window.location.pathname.replace('index.html', '')}#/${id}`;
    navigator.clipboard.writeText(urlToCopy).then(showCopyNotification).catch(err => console.error('URL kopyalanamadı: ', err));
}

document.addEventListener('DOMContentLoaded', () => {
    // --- YENİ BÖLÜM: PWA ve Bildirim Mantığı ---
    function setupPWA() {
        if (!('serviceWorker' in navigator)) return; // Tarayıcı desteklemiyorsa hiçbir şey yapma

        // 1. Service Worker'ı Kaydet
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('ServiceWorker kaydedildi:', reg))
                .catch(err => console.log('ServiceWorker kaydı başarısız:', err));
        });

        const installButton = document.getElementById('install-button');
        const notifyButton = document.getElementById('notify-button');
        let deferredPrompt;

        // 2. Kurulum (Install) Butonu Mantığı
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installButton.style.display = 'block'; // Kurulum butonunu göster
        });

        installButton.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            installButton.style.display = 'none';
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Kullanıcı kurulum istemine yanıt verdi: ${outcome}`);
            deferredPrompt = null;
        });

        window.addEventListener('appinstalled', () => {
            installButton.style.display = 'none';
            deferredPrompt = null;
        });

        // 3. Bildirim (Notification) Butonu Mantığı
        if ('Notification' in window && 'PushManager' in window) {
            notifyButton.addEventListener('click', handleNotificationClick);
            updateNotificationButton();
        }

        async function handleNotificationClick() {
            if (Notification.permission === 'granted') {
                console.log('Bildirim izni zaten verilmiş.');
                // İleride burada abonelikten çıkma mantığı olabilir.
            } else if (Notification.permission === 'denied') {
                alert('Bildirim izni engellenmiş. Tarayıcı ayarlarından değiştirmeniz gerekiyor.');
            } else {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Bildirim izni verildi!');
                    // İzin verildikten sonra abonelik oluştur.
                    // Şimdilik sadece konsola yazdırıyoruz.
                    const subscription = await getSubscription();
                    console.log('Abonelik nesnesi:', subscription);
                    // TODO: Bu aboneliği backend'e gönder.
                } else {
                    console.log('Bildirim izni verilmedi.');
                }
                updateNotificationButton();
            }
        }

        function updateNotificationButton() {
            if (!('Notification' in window)) {
                notifyButton.style.display = 'none';
                return;
            }

            if (Notification.permission === 'granted') {
                notifyButton.textContent = 'Bildirimler Açık ✅';
                notifyButton.disabled = true; // Şimdilik tekrar tıklanmasın
            } else if (Notification.permission === 'denied') {
                notifyButton.textContent = 'Bildirimler Engelli 🚫';
                notifyButton.disabled = true;
            } else {
                notifyButton.textContent = 'Bildirimleri Aç 🔔';
                notifyButton.disabled = false;
            }
            notifyButton.style.display = 'block';
        }

        async function getSubscription() {
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();
            if (subscription === null) {
                // Henüz abonelik yok, yeni bir tane oluştur.
                // TODO: VAPID public key'i buraya ekleyeceğiz.
                const VAPID_PUBLIC_KEY = 'HENÜZ_YOK'; 
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: VAPID_PUBLIC_KEY
                });
            }
            return subscription;
        }
    }
    
    // PWA kurulumunu başlat
    setupPWA();


    // --- Diğer tüm kodlar... ---
    const copyrightElement = document.getElementById('copyright-text');
    if (copyrightElement) {
        copyrightElement.textContent = `© ${new Date().getFullYear()} istanbulin. Tüm Hakları Saklıdır.`;
    }
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    const storage = { get: (key) => { try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : []; } catch (e) { console.error("LocalStorage okunamadı:", e); return []; } }, set: (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.error("LocalStorage'a yazılamadı:", e); } } };
    let readMarkers = new Set(storage.get('readMarkers'));
    function markAsRead(id) { if (!readMarkers.has(id.toString())) { readMarkers.add(id.toString()); storage.set('readMarkers', Array.from(readMarkers)); } }
    const map = L.map('map', { attributionControl: false }).setView([41.0082, 28.9784], 13);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, maxNativeZoom: 19, noWrap: true }).addTo(map);
    L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | Esri' }).addTo(map);
    L.control.locate({ position: 'topleft', setView: 'once', flyTo: true, strings: { title: "Mevcut Konumumu Göster" } }).addTo(map);
    const markersLayer = L.markerClusterGroup();
    const allMarkers = {};
    let allData = [];
    function directSearch(query) { const lowerCaseQuery = query.toLowerCase().trim(); if (!lowerCaseQuery) return []; return allData.filter(item => item.title.toLowerCase().includes(lowerCaseQuery) || item.description.toLowerCase().includes(lowerCaseQuery) || item.id.toString() === lowerCaseQuery); }
    L.Control.Fullscreen = L.Control.extend({onAdd:function(map){const c=L.DomUtil.create("div","leaflet-bar leaflet-control leaflet-control-custom leaflet-control-fullscreen");this._link=L.DomUtil.create("a","fullscreen-icon fullscreen-enter",c);this._link.href="#";this._link.title="Tam Ekran";L.DomEvent.on(this._link,"click",L.DomEvent.stop).on(this._link,"click",this._toggleFullscreen,this);return c},_toggleFullscreen:function(){document.body.classList.toggle("map-is-fullscreen");this._updateIcon();setTimeout(()=>map.invalidateSize(),300)},_updateIcon:function(){if(document.body.classList.contains("map-is-fullscreen")){this._link.classList.remove("fullscreen-enter");this._link.classList.add("fullscreen-exit");this._link.title="Tam Ekrandan Çık"}else{this._link.classList.remove("fullscreen-exit");this._link.classList.add("fullscreen-enter");this._link.title="Tam Ekran"}}});
    L.control.fullscreen = (opts) => new L.Control.Fullscreen(opts);
    L.control.fullscreen({ position: 'topright' }).addTo(map);
    L.Control.Search = L.Control.extend({onAdd:function(map){this._container=L.DomUtil.create("div","leaflet-bar leaflet-control leaflet-control-custom");this._button=L.DomUtil.create("a","leaflet-control-search",this._container);this._button.innerHTML='<span class="search-icon">🔍</span>';this._button.href="#";this._button.title="Ara";this._form=L.DomUtil.create("div","leaflet-control-search-expanded",this._container);this._input=L.DomUtil.create("input","search-input",this._form);this._input.type="text";this._input.placeholder="Ara...";this._results=L.DomUtil.create("div","search-results",this._form);L.DomUtil.addClass(this._form,"leaflet-hidden");L.DomEvent.on(this._button,"click",L.DomEvent.stop).on(this._button,"click",this._toggle,this);L.DomEvent.on(this._input,"input",this._search,this);L.DomEvent.on(this._form,"click",L.DomEvent.stop);L.DomEvent.on(map,"click",this._hide,this);return this._container},_toggle:function(){if(L.DomUtil.hasClass(this._form,"leaflet-hidden")){L.DomUtil.removeClass(this._form,"leaflet-hidden");this._input.focus()}else{this._hide()}},_hide:function(){this._input.value="";this._results.innerHTML="";L.DomUtil.addClass(this._form,"leaflet-hidden")},_search:function(){const q=this._input.value;const r=directSearch(q);this._displayResults(r)},_displayResults:function(r){this._results.innerHTML="";if(r.length>0&&this._input.value){r.slice(0,10).forEach(i=>{const e=L.DomUtil.create("div","result-item",this._results);e.textContent=i.title;L.DomEvent.on(e,"click",()=>{goToMarker(i.id);this._hide()})})}}});
    L.control.search = (opts) => new L.Control.Search(opts);
    L.control.search({ position: 'topright' }).addTo(map);
    function goToMarker(id) { const marker = allMarkers[id]; if (marker) { map.setView(marker.getLatLng(), 17); marker.openPopup(); } }
    function createPopupContent(item) { const imageUrl = item.image && (item.image.startsWith('http') ? item.image : `images/${item.image}`); const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${item.title}" loading="lazy">` : ''; const sourceHtml = item.source ? (item.source.startsWith('http') ? `<p><strong><a href="${item.source}" target="_blank" rel="noopener noreferrer">Kaynak</a></strong></p>` : `<p><strong>Kaynak:</strong> ${item.source}</p>`) : ''; const contributorHtml = item.contributor ? `<p><strong>Ekleyen:</strong> ${item.contributor}</p>` : ''; const shareHtml = `<p class="share-link-container"><strong>Paylaş: <a href="#" onclick="copyShareLink(event, '${item.id}')" title="Bu yerin linkini kopyala">🔗</a></strong></p>`; const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`; const directionsHtml = `<p class="share-link-container"><strong>Yol Tarifi: <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" title="Google Haritalar'da yol tarifi al">🧭</a></strong></p>`; return `${imageHtml}<div class="popup-text-content"><h3>${item.title}</h3><p>${item.description}</p>${sourceHtml}${contributorHtml}${shareHtml}${directionsHtml}</div>`; }
    function addMarkers(data) { const lastSeenMarkerIds = new Set(storage.get('lastSeenMarkers')); data.forEach(item => { const isUnread = !readMarkers.has(item.id.toString()); const iconClass = isUnread ? 'custom-marker-icon new-marker' : 'custom-marker-icon'; const markerIcon = L.divIcon({ className: iconClass, html: 'i', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -25] }); const marker = L.marker([item.lat, item.lng], { icon: markerIcon }); marker.on('click', () => { if (isUnread) { markAsRead(item.id); marker.setIcon(L.divIcon({ className: 'custom-marker-icon', html: 'i', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -25] })); } window.location.hash = `/${item.id}`; }); marker.bindPopup(() => createPopupContent(item), { minWidth: 300 }); markersLayer.addLayer(marker); allMarkers[item.id] = marker; }); map.addLayer(markersLayer); openMarkerFromUrl(); const currentMarkerIds = data.map(item => item.id); storage.set('lastSeenMarkers', currentMarkerIds); }
    function openMarkerFromUrl() { const hash = window.location.hash; if (hash && hash.startsWith('#/')) { const idToOpen = hash.substring(2); goToMarker(idToOpen); } }
    fetch('markers.json').then(response => response.json()).then(data => { allData = data; addMarkers(data); }).catch(error => { console.error('Veri çekilirken bir hata oluştu:', error); alert('Harita verileri yüklenirken bir sorun oluştu.'); });
});
