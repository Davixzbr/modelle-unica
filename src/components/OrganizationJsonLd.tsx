import { SITE_URL } from "@/lib/env";

/** JSON-LD Organization/LocalBusiness da loja (layout do site). */
export default function OrganizationJsonLd({
  name,
  instagram,
}: {
  name: string;
  instagram: string;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    name,
    url: SITE_URL,
    sameAs: [instagram],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
