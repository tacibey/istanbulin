document.addEventListener('DOMContentLoaded', () => {
    // 1. Botpoison'ı başlat
    // BURAYA KENDİ BOTPOISON PUBLIC KEY'İNİ YAPIŞTIR
    const botpoison = new Botpoison({
        publicKey: 'SENIN_BOTPOISON_PUBLIC_KEY',
    });

    // 2. Botpoison bileşenini HTML'deki yuvaya yerleştir
    botpoison.mount('#botpoison-challenge');
    
    // 3. Harita Ayarları
    const map = L.map('yeni-map').setView([41.0082, 28.9784], 12);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Leaflet | Esri'
    }).addTo(map);

    // YENİ: Haritanın boyutunu yeniden hesaplaması için komut
    // Bu, haritanın düzgün bir şekilde görünmesini sağlar.
    setTimeout(function() {
        map.invalidateSize();
    }, 100); // 100 milisaniye gecikme, tarayıcıya zaman tanımak için fazlasıyla yeterli.

    // 4. Form Elemanlarını Seç
    const form = document.querySelector('.yeni-form');
    const latInput = document.getElementById('lat');
    const lngInput = document.getElementById('lng');
    const submitBtn = document.getElementById('submit-btn');
    const submitWarning = document.getElementById('submit-warning');

    let tempMarker = null;

    // 5. Haritaya Tıklama Olayı (Değişiklik yok)
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }
        tempMarker = L.marker([lat, lng]).addTo(map);
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
        submitBtn.disabled = false;
        submitWarning.style.display = 'none';
        map.flyTo([lat, lng], 15);
    });

    // 6. Form Gönderimini JavaScript ile Yönet (Değişiklik yok)
    form.addEventListener('submit', (e) => {
        e.preventDefault(); 

        const originalButtonText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gönderiliyor...';

        botpoison.challenge()
            .then(({ solution }) => {
                const formData = new FormData(form);
                formData.append('_botpoison', solution);
                
                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                    }
                })
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/'; 
                    } else {
                        throw new Error('Form gönderimi başarısız oldu.');
                    }
                })
                .catch(error => {
                    alert('Bir hata oluştu. Lütfen tekrar deneyin. Hata: ' + error.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalButtonText;
                });
            })
            .catch(error => {
                alert('Spam doğrulaması başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalButtonText;
            });
    });
});
