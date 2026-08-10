import AnuncioCreator from "@/components/admin/anuncios/AnuncioCreator";

export default function AnunciosPage() {
  return (
    <div>
      <h1 className="mb-2 font-display text-2xl font-bold text-ink">Anúncios</h1>
      <p className="mb-6 max-w-2xl text-sm text-ink/60">
        Cole o link de afiliado, gere a capa 9:16 e a legenda com hashtags para
        divulgar o produto na Shopee, Pinterest e outras redes. Nada aqui é
        salvo — é uma ferramenta de criação, o cadastro do produto continua em{" "}
        <span className="font-semibold text-ink/80">Produtos</span>.
      </p>
      <AnuncioCreator />
    </div>
  );
}
