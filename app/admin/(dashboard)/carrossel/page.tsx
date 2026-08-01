import { getBanners, BANNER_SLOTS } from "@/lib/banners-db";
import BannerSlotForm from "@/components/admin/BannerSlotForm";

export const dynamic = "force-dynamic";

export default async function CarrosselPage() {
  const banners = await getBanners();
  const porSlot = new Map(banners.map((b) => [b.slot, b]));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink">
          Fotos do carrossel
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/55">
          O carrossel da home tem quatro faixas. As duas primeiras são fixas — a
          da logo e a da ilustração 3D. As duas últimas são suas: suba uma foto
          para anunciar o que quiser. Espaço vazio não deixa buraco no site; a
          faixa volta a mostrar o conteúdo padrão.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {BANNER_SLOTS.map((slot) => {
          const banner = porSlot.get(slot);
          return (
            <BannerSlotForm
              key={slot}
              slot={slot}
              initial={
                banner
                  ? { image: banner.image, link: banner.link, alt: banner.alt }
                  : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}
