document.addEventListener('DOMContentLoaded', () => {
    // Harita Başlangıç Ayarları
    const map = L.map('map', {
        attributionControl: false // Varsayılan attribution kontrolünü devre dışı bırak
    }).setView([41.0082, 28.9784], 13); // İstanbul merkez koordinatları ve zoom seviyesi

    // ESRI WorldStreetMap katmanını güncellenmiş parametrelerle ekleme
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19, // Maksimum zoom seviyesi artırıldı
        maxNativeZoom: 19, // Orijinal karo verilerinin maksimum seviyesi
        noWrap: true // Harita dışındaki boş alanlarda uyarı göstermeyi engeller
    }).addTo(map);

    // Özel attribution kontrolünü ekleme (sadece "Leaflet" yazısı)
    L.control.attribution({
        position: 'bottomright',
        prefix: 'Leaflet | Esri'
    }).addTo(map);

    // Konum butonunu ekleme
    L.control.locate({
        position: 'topleft',
        setView: 'once',
        flyTo: true,
        strings: {
            title: "Mevcut Konumumu Göster",
            popup: "Buradasınız!"
        },
        locateOptions: {
            maxZoom: 16
        },
        drawCircle: false,
        initialZoomLevel: 16
    }).addTo(map);

    // Özel "i" ikonunu tanımlama
    const customMarkerIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: 'i',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -25]
    });

    // Marker küme grubunu oluşturma
    const markers = L.markerClusterGroup();

    // data.json dosyasından verileri çekme ve haritaya ekleme
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            data.forEach(item => {
                const marker = L.marker([item.lat, item.lng], { icon: customMarkerIcon });

                // YENİ: Görsel etiketini oluşturma
                // Eğer JSON'da 'image' alanı varsa, bir <img> etiketi oluştur. Yoksa boş bir string ata.
                const imageHtml = item.image ? `<img src="images/${item.image}" alt="${item.title}">` : '';

                // Kaynak linkini oluşturma
                const sourceLink = item.source && item.source.startsWith('http') ?
                                   `<a href="${item.source}" target="_blank">Kaynak</a>` :
                                   'Belirtilmemiş';

                // YENİ: Popup içeriğini görseli de içerecek şekilde güncelleme
                const popupContent = `
                    ${imageHtml}
                    <div class="popup-text-content">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <p><strong>Adres:</strong> ${item.address || 'Belirtilmemiş'}</p>
                        <p><strong>Mekan:</strong> ${item.place || 'Belirtilmemiş'}</p>
                        <p>${sourceLink}</p>
                        <p><strong>Ekleyen:</strong> ${item.contributor || 'Anonim'}</p>
                    </div>
                `;

                marker.bindPopup(popupContent);
                markers.addLayer(marker);
            });
            map.addLayer(markers);
        })
        .catch(error => {
            console.error('Veri çekilirken bir hata oluştu:', error);
            alert('Harita verileri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
        });
});
