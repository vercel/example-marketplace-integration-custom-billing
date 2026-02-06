import { getInstallationBillingPlans } from "@/lib/partner";
import { withAuth } from "@/lib/vercel/auth";

export const GET = withAuth(async (claims) => {
  console.log("[GET /v1/installations/:installationId/plans] Request:", {
    installationId: claims.installation_id,
    claims,
  });

  const billingPlans = await getInstallationBillingPlans(
    claims.installation_id,
    claims.account_id,
  );

  console.log("[GET /v1/installations/:installationId/plans] Response:", JSON.stringify(billingPlans, null, 2));

  return Response.json(billingPlans);
});
