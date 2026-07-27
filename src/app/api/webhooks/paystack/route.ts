import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { markDonationPaid } from "@/lib/donations-server";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "charge.success") {
    await markDonationPaid(event.data.reference, event.data.amount);
  }

  return NextResponse.json({ received: true });
}
