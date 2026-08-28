import { createServerFn } from "@tanstack/react-start";

 /**
  * Tells the storefront whether live M-Pesa STK push is available yet.
  *
  * M-Pesa intentionally remains disabled until the WAGI storefront
  * and Laravel backend are fully working.
  */
export const getMpesaStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      enabled: false,
    };
  },
);

/**
 * Starts an M-Pesa STK push.
 *
 * M-Pesa is intentionally inactive for now.
 * This keeps the existing "coming soon" behavior while
 * the Laravel payment system is being completed.
 */
export const startMpesaPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { orderId: string; phone: string }) => {
    return input;
  })
  .handler(async () => {
    return {
      status: "unavailable" as const,
      message:
        "M-Pesa checkout is coming soon. Please pay on delivery for now.",
    };
  });