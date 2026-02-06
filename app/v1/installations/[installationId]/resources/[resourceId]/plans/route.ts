import { getResourceBillingPlans } from "@/lib/partner";
import { withAuth } from "@/lib/vercel/auth";

interface Params {
  installationId: string;
  resourceId: string;
}

export const GET = withAuth(
  async (claims, _request, { params }: { params: Params }) => {
    console.log("[GET /v1/installations/:installationId/resources/:resourceId/plans] Request:", {
      installationId: claims.installation_id,
      resourceId: params.resourceId,
      claims,
    });

    const response = await getResourceBillingPlans(
      claims.installation_id,
      params.resourceId,
      claims.account_id,
    );

    console.log("[GET /v1/installations/:installationId/resources/:resourceId/plans] Response:", JSON.stringify(response, null, 2));

    return Response.json(response);
  },
);
