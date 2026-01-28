import { getInstallationBillingPlans } from "@/lib/partner";
import { withAuth } from "@/lib/vercel/auth";

export const GET = withAuth(async (claims) => {
  const billingPlans = await getInstallationBillingPlans(
    claims.installation_id,
  );
  console.log("billingPlans", billingPlans);
  return Response.json(billingPlans);
});
