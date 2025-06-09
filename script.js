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
                const imageHtml = item.image ? `<img src="${item.image}" alt="${item.title}">` : ''; // Görsel yolunu images/ klasörü olmadan direkt alıyoruz
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
        
    // === YENİ: YER EKLEME FONKSİYONLARI ===

    // HTML elemanlarını seçelim
    const addPlaceBtn = document.getElementById('add-place-btn');
    const formContainer = document.getElementById('form-container');
    const closeFormBtn = document.getElementById('close-form-btn');
    const placeForm = document.getElementById('place-form');
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');
    const addPlaceInfo = document.getElementById('add-place-info');

    let isAddMode = false; // Yer ekleme modu aktif mi?
    let tempMarker = null; // Kullanıcının seçtiği yeri gösteren geçici marker

    // Formu kapatma fonksiyonu
    function closeForm() {
        formContainer.classList.add('hidden');
        if (tempMarker) {
            map.removeLayer(tempMarker); // Geçici markeri haritadan kaldır
            tempMarker = null;
        }
        // Eğer yer ekleme modu açıksa kapat
        if (isAddMode) {
            isAddMode = false;
            map.getContainer().style.cursor = ''; // İmleci normale döndür
            addPlaceInfo.classList.add('hidden'); // Bilgi mesajını gizle
        }
    }

    // '+' butonuna tıklandığında
    addPlaceBtn.addEventListener('click', () => {
        isAddMode = true;
        map.getContainer().style.cursor = 'crosshair'; // İmleci '+' yap
        addPlaceInfo.classList.remove('hidden'); // "Yer seçin" mesajını göster
    });

    // Haritaya tıklandığında
    map.on('click', (e) => {
        if (!isAddMode) return; // Eğer yer ekleme modunda değilsek hiçbir şey yapma

        // Geçici bir marker oluştur ve haritaya ekle
        if (tempMarker) {
            map.removeLayer(tempMarker); // Önceki geçici markeri kaldır
        }
        tempMarker = L.marker(e.latlng).addTo(map);

        // Gizli inputlara koordinatları yaz
        latInput.value = e.latlng.lat;
        lngInput.value = e.latlng.lng;

        // Formu göster
        formContainer.classList.remove('hidden');

        // Yer ekleme modunu kapat
        isAddMode = false;
        map.getContainer().style.cursor = ''; // İmleci normale döndür
        addPlaceInfo.classList.add('hidden'); // Bilgi mesajını gizle
    });

    // Formdaki 'X' butonuna tıklandığında formu kapat
    closeFormBtn.addEventListener('click', closeForm);
    
    // Form gönderildiğinde (başarıyla gönderilirse Formspree teşekkür sayfasına yönlendirir)
    // Eğer kullanıcı formu gönderdikten sonra aynı sayfada kalmasını istersek daha karmaşık bir yapı gerekir,
    // ama bu haliyle en basit ve en etkili çözüm.
    placeForm.addEventListener('submit', () => {
        // Form gönderildikten 0.5 saniye sonra formu ve geçici pini temizle
        setTimeout(() => {
             placeForm.reset(); // Formu sıfırla
             closeForm();
        }, 500);
    });
});
