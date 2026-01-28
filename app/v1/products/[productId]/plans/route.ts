import { getProductBillingPlans } from "@/lib/partner";
import { readRequestBodyWithSchema } from "@/lib/utils";
import { withAuth } from "@/lib/vercel/auth";
import { resourceSchema } from "@/lib/vercel/schemas";

interface Params {
  productId: string;
}

export const GET = withAuth(
  async (claims, request, { params }: { params: Params }) => {
    const url = new URL(request.url);
    const metadataQuery = url.searchParams.get("metadata");

    console.log("[GET /v1/products/:productId/plans] Request:", {
      productId: params.productId,
      installationId: claims.installation_id,
      metadata: metadataQuery,
      claims,
    });

    const response = await getProductBillingPlans(
      params.productId,
      claims.installation_id,
    );

    if (metadataQuery) {
      const metadata: Record<string, string> = JSON.parse(metadataQuery);
      if (metadata.primaryRegion === "sfo1") {
        response.plans = response.plans.map((plan) => ({
          ...plan,
          name: `${plan.name} (us-west-1)`,
          description: plan.name === "Pro" ? `$9 every Gb` : plan.description,
        }));
      }
    }

    console.log("[GET /v1/products/:productId/plans] Response:", JSON.stringify(response, null, 2));

    return Response.json(response);
  },
);
