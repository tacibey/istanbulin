// YENİ FONKSİYONLAR: Kopyalama ve bildirim için.
// Bunları en üste, global alana koyuyoruz ki her yerden erişilebilsin.

// Kopyalama bildirimini gösteren fonksiyon
function showCopyNotification() {
    // Eğer ekranda zaten bir bildirim varsa, yenisini oluşturmadan önce eskisini kaldır
    const existingNotification = document.getElementById('copy-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Yeni bildirim elementini oluştur
    const notification = document.createElement('div');
    notification.id = 'copy-notification';
    notification.textContent = 'URL Kopyalandı!';
    document.body.appendChild(notification);

    // Bildirimin görünür olmasını sağla (CSS'teki animasyonu tetikler)
    setTimeout(() => {
        notification.classList.add('show');
    }, 10); // 10ms gecikme tarayıcının geçişi algılamasına yardımcı olur

    // 2 saniye sonra bildirimi kaldır
    setTimeout(() => {
        notification.classList.remove('show');
        // Animasyonun bitmesini bekleyip elementi DOM'dan tamamen sil
        setTimeout(() => {
            notification.remove();
        }, 300); // CSS transition süresiyle aynı olmalı
    }, 2000);
}

// Paylaş linkine tıklandığında çalışan fonksiyon
function copyShareLink(event, id) {
    // Linkin varsayılan davranışını (sayfayı yukarı kaydırma) engelle
    event.preventDefault();
    
    // Kopyalanacak URL'i oluştur (ör: https://istanbulin.org/#/3)
    const urlToCopy = `${window.location.origin}${window.location.pathname.replace('index.html', '')}#/${id}`;

    // Panoya kopyalama işlemi
    navigator.clipboard.writeText(urlToCopy).then(() => {
        // Kopyalama başarılıysa bildirimi göster
        showCopyNotification();
    }).catch(err => {
        // Hata olursa konsola yazdır
        console.error('URL kopyalanamadı: ', err);
        alert("URL kopyalanamadı. Lütfen manuel olarak kopyalayın.");
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map', {
        attributionControl: false
    }).setView([41.0082, 28.9784], 13);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 19,
        noWrap: true
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | Esri' }).addTo(map);
    L.control.locate({ position: 'topleft', setView: 'once', flyTo: true, strings: { title: "Mevcut Konumumu Göster", popup: "Buradasınız!" } }).addTo(map);

    const customMarkerIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: 'i',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -25]
    });

    const markers = L.markerClusterGroup();
    const createdMarkers = {}; 

    // DEĞİŞEN FONKSİYON: createPopupContent'e paylaşım linki eklendi
    function createPopupContent(item) {
        let imageHtml = '';
        if (item.image) {
            const imageUrl = item.image.startsWith('http') ? item.image : `images/${item.image}`;
            imageHtml = `<img src="${imageUrl}" alt="${item.title}" loading="lazy">`;
        }

        let sourceHtml = '';
        if (item.source) {
            if (item.source.startsWith('http')) {
                sourceHtml = `<p><strong><a href="${item.source}" target="_blank" rel="noopener noreferrer">Kaynak</a></strong></p>`;
            } 
            else {
                sourceHtml = `<p><strong>Kaynak:</strong> ${item.source}</p>`;
            }
        }

        const contributorHtml = item.contributor ? `<p><strong>Ekleyen:</strong> ${item.contributor}</p>` : '';
        
        // YENİ: Paylaşım linki HTML'i
        const shareHtml = `
            <p class="share-link-container">
                <strong>Paylaş: 
                    <a href="#" onclick="copyShareLink(event, '${item.id}')" title="Bu yerin linkini kopyala">🔗</a>
                </strong>
            </p>`;

        return `
            ${imageHtml}
            <div class="popup-text-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                ${sourceHtml}
                ${contributorHtml}
                ${shareHtml}
            </div>
        `;
    }

    function openMarkerFromUrl() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#/')) {
            const idToOpen = hash.substring(2);
            const markerToOpen = createdMarkers[idToOpen];

            if (markerToOpen) {
                map.whenReady(() => {
                    markers.zoomToShowLayer(markerToOpen, () => {
                        markerToOpen.openPopup();
                    });
                });
            }
        }
    }

    function addMarkersInChunks(data) {
        let index = 0;
        const chunkSize = 50; 

        function processChunk() {
            const chunkEnd = Math.min(index + chunkSize, data.length);
            for (; index < chunkEnd; index++) {
                const item = data[index];
                const marker = L.marker([item.lat, item.lng], { icon: customMarkerIcon });

                marker.bindPopup(() => {
                    const popupElement = document.createElement('div');
                    popupElement.className = 'popup-text-content';
                    popupElement.innerHTML = '<p>Yükleniyor...</p>';

                    fetch(`data/${item.id}.json`)
                        .then(response => {
                            if (!response.ok) { throw new Error('Network response was not ok'); }
                            return response.json();
                        })
                        .then(detailData => {
                            marker.getPopup().setContent(createPopupContent(detailData));
                        })
                        .catch(error => {
                            console.error('Detay verisi çekilirken hata:', error);
                            popupElement.innerHTML = '<p>İçerik yüklenirken bir sorun oluştu.</p>';
                        });

                    return popupElement;
                }, {
                    minWidth: 300
                });

                marker.on('click', () => {
                    window.location.hash = `/${item.id}`;
                });
                
                markers.addLayer(marker);
                createdMarkers[item.id] = marker;
            }

            if (index < data.length) {
                requestAnimationFrame(processChunk);
            } else {
                map.addLayer(markers);
                openMarkerFromUrl();
            }
        }
        requestAnimationFrame(processChunk);
    }

    fetch('markers.json')
        .then(response => response.json())
        .then(data => {
            addMarkersInChunks(data);
        })
        .catch(error => {
            console.error('Veri çekilirken bir hata oluştu:', error);
            alert('Harita verileri yüklenirken bir sorun oluştu.');
        });
});
