document.addEventListener('DOMContentLoaded', () => {
    // Harita Başlangıç Ayarları
    const map = L.map('map', {
        attributionControl: false // Varsayılan attribution kontrolünü devre dışı bırak
    }).setView([41.0082, 28.9784], 13); // İstanbul merkez koordinatları ve zoom seviyesi

    // ESRI WorldStreetMap katmanını güncellenmiş parametrelerle ekleme
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 20, // Maksimum zoom seviyesi artırıldı
        maxNativeZoom: 20, // Orijinal karo verilerinin maksimum seviyesi
        noWrap: true // Harita dışındaki boş alanlarda uyarı göstermeyi engeller
    }).addTo(map);

    // Özel attribution kontrolünü ekleme (sadece "Leaflet" yazısı)
    L.control.attribution({
        position: 'bottomright',
        prefix: 'Leaflet | Esri'
    }).addTo(map);

    // Konum butonunu ekleme
    L.control.locate({
        position: 'topleft', // Butonun konumu
        setView: 'once', // Kullanıcının konumunu algıladıktan sonra haritayı bir kez konuma odaklar
        flyTo: true, // Haritayı animasyonlu bir şekilde konuma uçurur
        strings: {
            title: "Mevcut Konumumu Göster", // Butonun üzerine gelince çıkan yazı
            popup: "Buradasınız!" // Konum işaretine tıklayınca çıkan popup yazısı
        },
        locateOptions: {
            maxZoom: 16 // Konumu bulduktan sonra haritayı ne kadar yakınlaştıracağı
        },
        drawCircle: false, // Konum doğruluk dairesini çizme
        initialZoomLevel: 16 // locateOptions.maxZoom ayarlanmamışsa başlangıç yakınlaştırma seviyesi
    }).addTo(map);

    // Arama kutusu kaldırıldı. L.Control.geocoder kısmı yorum satırı yapıldı veya silindi.
    // L.Control.geocoder({
    //     defaultMarkGeocoded: false,
    //     placeholder: "Adres veya yer ara...",
    //     collapsed: true
    // }).addTo(map);

    // Özel "i" ikonunu tanımlama
    const customMarkerIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: 'i',
        iconSize: [30, 30], // İkonun boyutu
        iconAnchor: [15, 30], // İkonun alt ortasının koordinatı (işaretçinin dibi)
        popupAnchor: [0, -25] // Popup'ın açılacağı nokta (ikonun üstünde)
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

                // Kaynak linkini oluşturma
                const sourceLink = item.source && item.source.startsWith('http') ? 
                                   `<a href="${item.source}" target="_blank">Kaynak</a>` : 
                                   'Belirtilmemiş';

                // Popup içeriğini oluşturma - YENİ DÜZENLEMELERLE
                const popupContent = `
                    <h3>${item.title}</h3>
                    <p>${item.description}</p>
                    <p><strong>Adres:</strong> ${item.address || 'Belirtilmemiş'}</p>
                    <p><strong>Mekan:</strong> ${item.place || 'Belirtilmemiş'}</p>
                    <p>${sourceLink}</p>
                    <p><strong>Ekleyen:</strong> ${item.contributor || 'Anonim'}</p>
                `;

                marker.bindPopup(popupContent);
                markers.addLayer(marker); // Marker'ı doğrudan haritaya değil, küme grubuna ekle
            });
            map.addLayer(markers); // Tüm küme grubunu haritaya ekle
        })
        .catch(error => {
            console.error('Veri çekilirken bir hata oluştu:', error);
            // Kullanıcıya daha anlaşılır bir hata mesajı gösterebiliriz
            alert('Harita verileri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
        });
});
