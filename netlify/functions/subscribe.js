import { getStore } from "@netlify/blobs";
// Yeni netlify.toml ayarı sayesinde bu artık çalışmalı.
import { createHash } from "node:crypto"; 

// Netlify'ın beklediği standart handler formatı
export const handler = async (event) => {
  // Sadece POST isteklerini kabul et
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    // Gelen isteğin gövdesini (body) al
    const subscription = JSON.parse(event.body);

    // Abonelik nesnesini doğrula
    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid subscription object" }),
      };
    }

    // Netlify Blobs'a bağlan
    const store = getStore("subscriptions");
    
    // Güvenilir crypto modülü ile benzersiz anahtar oluştur
    const hash = createHash('sha256').update(JSON.stringify(subscription)).digest('hex');
    const key = `sub-${hash}`;

    // Aboneliği veritabanına kaydet
    await store.setJSON(key, subscription);

    console.log(`Abonelik kaydedildi: ${key}`);

    // Başarılı cevabı döndür
    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, key: key }),
    };

  } catch (error) {
    console.error("Abonelik fonksiyonunda hata:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
    };
  }
};
