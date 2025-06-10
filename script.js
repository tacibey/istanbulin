document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map', {
        attributionControl: false,
        fullscreenControl: true, // YENİ: Tam Ekran kontrolünü etkinleştir
        fullscreenControlOptions: {
            position: 'topright' // İkonun konumu
        }
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
    
    // Önceki cevaptaki performanslı popup ve kaynak mantığını koruyoruz.
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
            } else {
                sourceHtml = `<p><strong>Kaynak:</strong> ${item.source}</p>`;
            }
        }

        const contributorHtml = item.contributor ? `<p><strong>Ekleyen:</strong> ${item.contributor}</p>` : '';
        
        return `
            ${imageHtml}
            <div class="popup-text-content">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                ${sourceHtml}
                ${contributorHtml}
            </div>
        `;
    }

    function addMarkersInChunks(data) {
        let index = 0;
        const chunkSize = 50; 

        function processChunk() {
            const chunkEnd = Math.min(index + chunkSize, data.length);
            for (; index < chunkEnd; index++) {
                const item = data[index];
                const marker = L.marker([item.lat, item.lng], { icon: customMarkerIcon });
                marker.bindPopup(() => createPopupContent(item), {
                    minWidth: 260
                });
                markers.addLayer(marker);
            }

            if (index < data.length) {
                requestAnimationFrame(processChunk);
            } else {
                map.addLayer(markers);
            }
        }
        requestAnimationFrame(processChunk);
    }

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            addMarkersInChunks(data);
        })
        .catch(error => {
            console.error('Veri çekilirken bir hata oluştu:', error);
            alert('Harita verileri yüklenirken bir sorun oluştu.');
        });
});
