import { getStore } from "@netlify/blobs";
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
    const subscription = JSON.parse(event.body);

    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid subscription object" }),
      };
    }

    // YENİ DEĞİŞİKLİK: Netlify'a hangi siteye ait olduğumuzu manuel olarak söylüyoruz.
    // 'process.env.SITE_ID' Netlify'ın build sırasında otomatik olarak sağladığı bir değişkendir.
    // Bu, fonksiyonun doğru siteyle eşleşmesini garanti altına alır.
    const store = getStore("subscriptions", { siteID: process.env.SITE_ID });
    
    const hash = createHash('sha256').update(JSON.stringify(subscription)).digest('hex');
    const key = `sub-${hash}`;

    await store.setJSON(key, subscription);

    console.log(`Abonelik kaydedildi: ${key}`);

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
