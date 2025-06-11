import { getStore } from "@netlify/blobs";

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
    
    const store = getStore("subscriptions");
    const key = toBase64(subscription.endpoint);

    await store.setJSON(key, subscription);

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
