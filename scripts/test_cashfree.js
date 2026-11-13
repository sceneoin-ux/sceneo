async function testCashfree() {
  const appId = process.env.CASHFREE_APP_ID || "";
  const secretKey = process.env.CASHFREE_SECRET_KEY || "";
  const orderId = `test_order_${Date.now()}`;

  console.log("Connecting to Cashfree Sandbox API with App ID:", appId);

  try {
    const res = await fetch("https://sandbox.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: 527.50, // ₹500 ticket + ₹27.50 (5.5% fee)
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_test_9901",
          customer_phone: "9876543210",
          customer_name: "Sai Pavan",
          customer_email: "sceneo.in@gmail.com"
        },
        order_meta: {
          return_url: "https://sceneo.in/return?order_id={order_id}"
        }
      })
    });

    const data = await res.json();
    console.log("Status Code:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));

    if (res.ok && data.payment_session_id) {
      console.log("\n SUCCESS! Cashfree returned payment_session_id:");
      console.log(data.payment_session_id);
    } else {
      console.error("\n FAILED:", data);
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testCashfree();
