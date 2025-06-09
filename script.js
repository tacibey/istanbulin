document.addEventListener('DOMContentLoaded', () => {
    // Harita Başlangıç Ayarları
    const map = L.map('map').setView([41.0082, 28.9784], 13); // İstanbul merkez koordinatları ve zoom seviyesi

    // Stadia Maps Stamen Toner Lite katmanını ekleme (minimalist harita görünümü için)
    L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png', {
        minZoom: 0,
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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

    // Özel "i" ikonunu tanımlama
    const customMarkerIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: 'i',
        iconSize: [30, 30], // İkonun boyutu
        iconAnchor: [15, 30], // İkonun alt ortasının koordinatı (işaretçinin dibi)
        popupAnchor: [0, -25] // Popup'ın açılacağı nokta (ikonun üstünde)
    });

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
                const marker = L.marker([item.lat, item.lng], { icon: customMarkerIcon }).addTo(map);

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
            });
        })
        .catch(error => {
            console.error('Veri çekilirken bir hata oluştu:', error);
            // Kullanıcıya daha anlaşılır bir hata mesajı gösterebiliriz
            alert('Harita verileri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
        });
});
