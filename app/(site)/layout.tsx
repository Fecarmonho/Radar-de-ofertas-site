import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import PageViewTracker from "@/components/PageViewTracker";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageViewTracker />
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
