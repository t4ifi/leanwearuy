import { Footer } from "@/components/public/footer";
import { getSettings } from "@/lib/catalog";

/** Layout público: header lo pone cada página (necesita saber cuál está activa). */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <>
      <div className="flex-1">{children}</div>
      <Footer instagram={settings?.instagram ?? "leanwear.uy"} />
    </>
  );
}
