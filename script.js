document.addEventListener('DOMContentLoaded', () => {
    // Harita Başlangıç Ayarları
    const map = L.map('map').setView([41.0082, 28.9784], 13); // İstanbul merkez koordinatları ve zoom seviyesi

    // CartoDB Positron katmanını ekleme (Mevcut çalışan seçimin)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
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

    // Arama kutusunu haritaya ekleme (YENİ EKLENTİ KODU)
    L.Control.geocoder({
        defaultMarkGeocoded: false, // Arama sonucuna otomatik marker eklemez
        placeholder: "Adres veya yer ara...", // Arama kutusu için placeholder
        collapsed: true // Arama kutusu başlangıçta kapalı olsun (sadece ikon görünür)
    }).addTo(map);


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
