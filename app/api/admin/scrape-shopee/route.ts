import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-session";
import { scrapeShopeeProduct } from "@/lib/scrape-shopee";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Link não informado." }, { status: 400 });
  }

  try {
    const data = await scrapeShopeeProduct(url);

    if (!data.title && !data.image) {
      return NextResponse.json(
        {
          error:
            "Não consegui ler os dados desse link. Preencha manualmente os campos abaixo.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "Não consegui acessar esse link agora. Preencha manualmente os campos abaixo.",
      },
      { status: 422 }
    );
  }
}
