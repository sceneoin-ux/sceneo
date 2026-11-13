/**
 * SceneO Payment Gateway Activation Status
 * Set to true once Cashfree merchant account activation is approved.
 */
export const GATEWAY_STATUS = {
  isActivated: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ACTIVATED === "false" ? false : true,
  gatewayName: "Cashfree Payments India (RBI Regulated)",
  statusLabel: "Active & Verified",
  notice: "Cashfree Payment Gateway is fully activated. Real-time UPI and card ticket checkouts are live."
};
