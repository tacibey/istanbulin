document.addEventListener('DOMContentLoaded', () => {
    // Harita Başlangıç Ayarları
    const map = L.map('yeni-map').setView([41.0082, 28.9784], 12);

    // Harita katmanı
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Leaflet | Esri'
    }).addTo(map);

    // Form elemanlarını seç
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');
    const submitBtn = document.getElementById('submit-btn');
    const submitWarning = document.getElementById('submit-warning');

    let tempMarker = null;

    // Haritaya tıklandığında çalışacak fonksiyon
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;

        // Eğer daha önce bir marker konulduysa onu kaldır
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }

        // Yeni marker oluştur ve haritaya ekle
        tempMarker = L.marker([lat, lng]).addTo(map);

        // Gizli input alanlarını tıklanan koordinatlarla doldur
        latInput.value = lat.toFixed(6); // 6 ondalık basamak yeterli
        lngInput.value = lng.toFixed(6);

        // Gönder butonunu aktif et ve uyarıyı gizle
        submitBtn.disabled = false;
        submitWarning.style.display = 'none';

        // Kullanıcıya pini koyduğunu bildirmek için haritayı pinin olduğu yere odakla
        map.flyTo([lat, lng], 15);
    });
});
