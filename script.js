document.addEventListener('DOMContentLoaded', () => {
    // ... (dosyanın başındaki harita ayarları ve fetch kısmı aynı kalacak) ...
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
                    } 
                    else {
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
        
    // === YER EKLEME FONKSİYONLARI ===

    const addPlaceBtn = document.getElementById('add-place-btn');
    const formContainer = document.getElementById('form-container');
    const closeFormBtn = document.getElementById('close-form-btn');
    const placeForm = document.getElementById('place-form');
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');
    const addPlaceInfo = document.getElementById('add-place-info');

    let isAddMode = false;
    let tempMarker = null;

    // YENİ: Pinleme moduna girmek için yardımcı fonksiyon
    function enterPinningMode() {
        isAddMode = true;
        map.getContainer().style.cursor = 'crosshair'; // İmleci '+' yap
        addPlaceInfo.classList.remove('hidden'); // "Yer seçin" mesajını göster
    }

    // YENİ: Pinleme modundan çıkmak için yardımcı fonksiyon
    function exitPinningMode() {
        isAddMode = false;
        map.getContainer().style.cursor = ''; // İmleci normale döndür
        addPlaceInfo.classList.add('hidden'); // Bilgi mesajını gizle
    }

    // DEĞİŞTİ: Formu kapatma fonksiyonu daha basit hale getirildi. Sadece DOM temizliği yapıyor.
    function closeForm() {
        formContainer.classList.add('hidden');
        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }
    }

    // '+' butonuna tıklandığında
    addPlaceBtn.addEventListener('click', () => {
        // Eğer zaten ekleme modundaysak, modu kapat ve işlemi iptal et.
        if (isAddMode) {
            exitPinningMode();
        } else {
            enterPinningMode();
        }
    });

    // Haritaya tıklandığında
    map.on('click', (e) => {
        if (!isAddMode) return;

        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker(e.latlng).addTo(map);

        latInput.value = e.latlng.lat;
        lngInput.value = e.latlng.lng;

        formContainer.classList.remove('hidden');

        // DEĞİŞTİ: Kullanıcı pin koyduktan sonra, formu doldururken yeni pin koyamasın diye moddan çıkıyoruz.
        exitPinningMode();
    });

    // DEĞİŞTİ: Formdaki 'X' butonuna tıklandığında kullanıcıyı tekrar pinleme moduna alıyoruz.
    closeFormBtn.addEventListener('click', () => {
        closeForm();        // Formu ve geçici pini temizle
        enterPinningMode(); // Kullanıcının yeni bir yer seçebilmesi için modu TEKRAR AÇ
    });
    
    // DEĞİŞTİ: Form gönderildiğinde işlem tamamen biter.
    placeForm.addEventListener('submit', () => {
        setTimeout(() => {
             placeForm.reset(); 
             closeForm(); // Sadece formu ve pini temizle. Mod zaten kapalı.
        }, 500);
    });
});
