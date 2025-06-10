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

    // 6. Form Gönderimini JavaScript ile Yönet
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // Tarayıcının formu normal şekilde göndermesini engelle

        // Kullanıcıya işlemde olduğunu bildir
        const originalButtonText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Gönderiliyor...';

        // Botpoison'dan challenge çözümünü al
        botpoison.challenge()
            .then(({ solution }) => {
                // Form verilerini al
                const formData = new FormData(form);

                // Botpoison çözümünü form verilerine ekle
                formData.append('_botpoison', solution);

                // Formu fetch API kullanarak Formspark'a gönder
                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json',
                    }
                })
                .then(response => {
                    if (response.ok) {
                        // Başarılı olursa anasayfaya yönlendir
                        // NOT: Formspark'ın kendi _redirect'i yerine JS ile yönlendirme daha garantilidir.
                        window.location.href = '/'; 
                    } else {
                        // Eğer Formspark bir hata dönerse (örn: limit aşıldı)
                        throw new Error('Form gönderimi başarısız oldu.');
                    }
                })
                .catch(error => {
                    // Ağ hatası veya Formspark hatası durumunda kullanıcıyı bilgilendir
                    alert('Bir hata oluştu. Lütfen tekrar deneyin. Hata: ' + error.message);
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalButtonText;
                });
            })
            .catch(error => {
                // Botpoison challenge'ı başarısız olursa
                alert('Spam doğrulaması başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalButtonText;
            });
    });
});
