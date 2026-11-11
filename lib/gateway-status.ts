/**
 * SceneO Payment Gateway Activation Status
 * Set to true once Cashfree merchant account activation is approved.
 */
export const GATEWAY_STATUS = {
  isActivated: process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_ACTIVATED === "true" || false,
  gatewayName: "Cashfree Payments India (RBI Regulated)",
  statusLabel: "Under Verification",
  notice: "Ticket checkout and live event publishing will unlock automatically once payment gateway merchant verification is complete."
};
