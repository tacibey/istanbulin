document.addEventListener('DOMContentLoaded', () => {
    // Harita Başlangıç Ayarları
    const map = L.map('map').setView([41.0082, 28.9784], 13); // İstanbul merkez koordinatları ve zoom seviyesi

    // OpenStreetMap katmanını ekleme
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

    // Özel "i" ikonunu tanımlama
    const customMarkerIcon = L.divIcon({
        className: 'custom-marker-icon',
        html: 'i',
        iconSize: [30, 30], // İkonun boyutu
        iconAnchor: [15, 30], // İkonun alt ortasının koordinatı (işaretçinin dibi)
        popupAnchor: [0, -25] // Popup'ın açılacağı nokta (ikonun üstünde)
    });

    // data.json dosyasından verileri çekme
    fetch('data.json')
        .then(response => response.json())
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
            // Kullanıcıya bir hata mesajı gösterebilirsiniz
            alert('Harita verileri yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
        });
});
