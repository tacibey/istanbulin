document.addEventListener('DOMContentLoaded', () => {
    // Harita Başlangıç Ayarları
    const map = L.map('map').setView([41.0082, 28.9784], 13); // İstanbul merkez koordinatları ve zoom seviyesi

    // Esri WorldStreetMap katmanını ekleme (Tekrar deneme)
    // Bu URL'in 'mature support' olduğu unutulmamalıdır, gelecekte sorunlar yaşanabilir.
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_StreetMap/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
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

    // Arama kutusunu haritaya ekleme
    L.Control.geocoder({
        defaultMarkGeocoded: false,
        placeholder: "Adres veya yer ara...",
        collapsed: true
    }).addTo(map);

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
                const placeType = item.place ? item.place.toLowerCase() : 'default';
                const iconClassName = `custom-marker-icon place-${placeType}`;

                // Özel "i" ikonunu tanımlama (önceki istek üzerine siyah yuvarlak, beyaz 'i')
                const customMarkerIcon = L.divIcon({
                    className: iconClassName,
                    html: 'i',
                    iconSize: [26, 26], // Küçük boyut
                    iconAnchor: [13, 26], // İkonun alt ortası (boyutun yarısı)
                    popupAnchor: [0, -25] // Popup konumu
                });

                const marker = L.marker([item.lat, item.lng], { icon: customMarkerIcon });

                // Popup içeriğini oluşturma
                const popupContent = `
                    <h3>${item.title}</h3>
                    <p><strong>Açıklama:</strong> ${item.description}</p>
                    <p><strong>Adres:</strong> ${item.address || 'Belirtilmemiş'}</p>
                    <p><strong>Mekan Tipi:</strong> ${item.place || 'Belirtilmemiş'}</p>
                    <p><strong>Kaynak:</strong> ${item.source || 'Belirtilmemiş'}</p>
                    <p><strong>Gönderen:</strong> ${item.contributor || 'Anonim'}</p>
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
