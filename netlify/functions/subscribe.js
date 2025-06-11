import { getStore } from "@netlify/blobs";

// Bu fonksiyon, bir string'i base64'e çevirir. Tarayıcıdaki btoa() fonksiyonunun
// Node.js/Deno ortamındaki karşılığıdır ve daha güvenilirdir.
const toBase64 = (str) => Buffer.from(str).toString('base64url');

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const subscription = JSON.parse(event.body);

    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid subscription object" }),
      };
    }

    // Netlify'a hiçbir ek bilgi vermeden, en basit haliyle store'u çağırıyoruz.
    // Bu, Netlify'ın tüm kimlik doğrulama işini kendisinin yapmasını tetikler.
    const store = getStore("subscriptions");
    
    // Herhangi bir crypto modülüne ihtiyaç duymadan, endpoint'i base64'e çevirerek
    // tamamen benzersiz ve güvenli bir anahtar oluşturuyoruz.
    const key = toBase64(subscription.endpoint);

    await store.setJSON(key, subscription);

    console.log(`Abonelik başarıyla kaydedildi. Anahtar: ${key}`);

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, key: key }),
    };

  } catch (error) {
    console.error("Abonelik fonksiyonunda kritik hata:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
    };
  }
};
