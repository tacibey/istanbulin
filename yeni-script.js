document.addEventListener('DOMContentLoaded', () => {
    // 1. Botpoison'ı başlat
    // BURAYA KENDİ BOTPOISON PUBLIC KEY'İNİ YAPIŞTIR
    const botpoison = new Botpoison({
        publicKey: 'pk_9e20dcf7-02cf-4c23-b265-35f8db88eeab',
    });

    // 2. Botpoison bileşenini HTML'deki yuvaya yerleştir
    botpoison.mount('#botpoison-challenge');
    
    // 3. Form elemanlarını seç
    const form = document.querySelector('.yeni-form');
    const submitBtn = form.querySelector('button[type="submit"]');

    // 4. Form gönderimini JavaScript ile yönet
    form.addEventListener('submit', (e) => {
        // Tarayıcının formu normal şekilde göndermesini engelle
        e.preventDefault(); 

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
                        window.location.href = '/'; 
                    } else {
                        // Eğer Formspark bir hata dönerse
                        throw new Error('Form gönderimi sunucu tarafından reddedildi.');
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
