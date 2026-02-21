// test-mpesa.js
const consumerKey = "deYfTrocJYS0R9IVZLLL6UFVWEshV1sOPo1Gexc6FGociK5P";
const consumerSecret =
  "AWPQXAIKEoPMrhNra5W1AsFzjB0XGvFbMyf9NLMdLLwjtYOZLlYSIM3X6AZD9c3G";

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
  .then((data) => console.log("Success:", data))
  .catch((err) => console.error("Error:", err));
