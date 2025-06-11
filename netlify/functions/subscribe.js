import { getStore } from "@netlify/blobs";

// Bu fonksiyon, bir string'i base64'e çevirir ve URL için güvenli hale getirir.
const toBase64 = (str) => Buffer.from(str).toString('base64url');

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Netlify ortam değişkenlerinden gerekli kimlik bilgilerini al.
    const siteID = process.env.NETLIFY_SITE_ID;
    const token = process.env.NETLIFY_API_TOKEN;

    // Eğer bu bilgiler Netlify'da ayarlanmamışsa, hata ver.
    if (!siteID || !token) {
      throw new Error("Site ID veya API Token ortam değişkenleri ayarlanmamış.");
    }

    const subscription = JSON.parse(event.body);

    if (!subscription || !subscription.endpoint) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Geçersiz abonelik nesnesi" }),
      };
    }
    
    // getStore fonksiyonunu, kimlik bilgilerini manuel olarak sağlayarak çağır.
    const store = getStore("subscriptions", { siteID, token });
    
    const key = toBase64(subscription.endpoint);

    await store.setJSON(key, subscription);

    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, key: key }),
    };

  } catch (error) {
    console.error("Abonelik fonksiyonunda kritik hata:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error", message: error.message }),
    };
  }
};
