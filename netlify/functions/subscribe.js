import { getStore } from "@netlify/blobs";

// crypto import'u kaldırıldı.

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const subscription = await req.json();

    if (!subscription || !subscription.endpoint) {
      return new Response("Invalid subscription object", { status: 400 });
    }

    const store = getStore("subscriptions");
    
    // YENİ ve DAHA BASİT ANAHTAR OLUŞTURMA YÖNTEMİ
    // Her aboneliğin benzersiz olan endpoint'ini base64'e kodlayarak
    // dosya sistemiyle uyumlu, güvenli bir anahtar elde ediyoruz.
    const key = btoa(subscription.endpoint);

    await store.setJSON(key, subscription);

    console.log(`Abonelik kaydedildi: ${key}`);

    return new Response(JSON.stringify({ success: true, key: key }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Abonelik hatası:", error);
    // Hata detayını frontend'e daha iyi göndermek için güncellendi
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
