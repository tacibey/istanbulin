import { getStore } from "@netlify/blobs";
import crypto from "crypto";

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const subscription = await req.json();

    // Abonelik nesnesinin temel doğruluğunu kontrol et
    if (!subscription || !subscription.endpoint) {
      return new Response("Invalid subscription object", { status: 400 });
    }

    // Netlify Blobs'da abonelikler için bir "store" aç
    const store = getStore("subscriptions");
    
    // Her abonelik için benzersiz ve tahmin edilemez bir anahtar oluştur.
    // Sadece endpoint'i kullanmak yerine, içeriğinin hash'ini alalım.
    const hash = crypto.createHash('sha256').update(JSON.stringify(subscription)).digest('hex');
    const key = `sub_${hash}`;

    // Bu anahtarla aboneliği Netlify Blobs'a kaydet
    await store.setJSON(key, subscription);

    console.log(`Abonelik kaydedildi: ${key}`);

    return new Response(JSON.stringify({ success: true, key: key }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Abonelik hatası:", error);
    return new Response(JSON.stringify({ success: false, error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
