import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsFloat from "@/components/WhatsFloat";
import ToastHost from "@/components/Toast";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import { getSiteConfig } from "@/lib/site-config";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSiteConfig();

  return (
    <>
      <OrganizationJsonLd name={site.name} instagram={site.instagram} />
      <Header />
      <main>{children}</main>
      <Footer whatsapp={site.whatsapp} whatsappDisplay={site.whatsappDisplay} instagram={site.instagram} instagramHandle={site.instagramHandle} />
      <WhatsFloat
        number={site.whatsapp}
        message={`Olá, ${site.name}! Vim pelo site e gostaria de mais informações.`}
      />
      <ToastHost />
    </>
  );
}
