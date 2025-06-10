document.addEventListener('DOMContentLoaded', () => {
    // Harita ayarları ve diğer kontroller aynı kalıyor...
    const map = L.map('map', {
        attributionControl: false
    }).setView([41.0082, 28.9784], 13);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 19,
        noWrap: true
    }).addTo(map);

    L.control.attribution({ position: 'bottomright', prefix: 'Leaflet | Esri' }).addTo(map);
    L.control.locate({ position: 'topleft', setView: 'once', flyTo: true, strings: { title: "Mevcut Konumumu Göster" } }).addTo(map);

    const customMarkerIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: 'i',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -25]
    });

    const markers = L.markerClusterGroup();

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                if (!item.lat || !item.lng) return; // Koordinatı olmayan veriyi atla

                const marker = L.marker([item.lat, item.lng], { icon: customMarkerIcon });

                // YENİ: Popup içeriği güncellendi
                // "Tamamını Oku" butonu için link oluşturuluyor
                const detailPageUrl = `locations/${item.slug}.html`;

                const popupContent = `
                    <div class="mini-popup">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <a href="${detailPageUrl}" class="read-more-btn">Tamamını Oku</a>
                    </div>
                `;
                
                marker.bindPopup(popupContent, {
                    minWidth: 250 // Popup'ın minimum genişliği
                });

                markers.addLayer(marker);
            });
            map.addLayer(markers);
        })
        .catch(error => {
            console.error('Veri çekilirken bir hata oluştu:', error);
            alert('Harita verileri yüklenirken bir sorun oluştu.');
        });
});
