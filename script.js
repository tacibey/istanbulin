document.addEventListener('DOMContentLoaded', () => {
    // Harita Başlangıç Ayarları
    const map = L.map('map', {
        attributionControl: false
    }).setView([41.0082, 28.9784], 13);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
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
            title: "Mevcut Konumumu Göster",
            popup: "Buradasınız!"
        }
    }).addTo(map);

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
                const marker = L.marker([item.lat, item.lng], { icon: customMarkerIcon });

                let imageUrl = '';
                if (item.image) {
                    if (item.image.startsWith('http')) {
                        imageUrl = item.image;
                    } else {
                        imageUrl = `images/${item.image}`;
                    }
                }
                const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="${item.title}">` : '';
                const sourceLink = item.source ? `<a href="${item.source}" target="_blank">Kaynak</a>` : 'Belirtilmemiş';
                
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
            alert('Harita verileri yüklenirken bir sorun oluştu.');
        });
});
