// test-stk.js
const consumerKey = "deYfTrocJYS0R9IVZLLL6UFVWEshV1sOPo1Gexc6FGociK5P";
const consumerSecret =
  "AWPQXAIKEoPMrhNra5W1AsFzjB0XGvFbMyf9NLMdLLwjtYOZLlYSIM3X6AZD9c3G";
const passkey =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const shortcode = "174379";

// Generate timestamp
const getTimestamp = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Get access token first
const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

fetch(
  "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
  {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  },
)
  .then((res) => res.json())
  .then(async (tokenData) => {
    const token = tokenData.access_token;
    const timestamp = getTimestamp();

    // Generate password
    const password = Buffer.from(shortcode + passkey + timestamp).toString(
      "base64",
    );

    // Make STK push request
    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortcode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: "10",
          PartyA: "254708374149", // Test phone number
          PartyB: shortcode,
          PhoneNumber: "254708374149",
          CallBackURL: "https://your-domain.com/api/mpesa-callback",
          AccountReference: "Test",
          TransactionDesc: "Test payment",
        }),
      },
    );

    const result = await stkResponse.json();
    console.log("STK Push Result:", result);
  })
  .catch((err) => console.error("Error:", err));
