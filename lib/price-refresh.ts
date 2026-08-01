import "server-only";
import {
  getAllProducts,
  updateProductPrice,
  touchPriceCheckedAt,
} from "@/lib/products-db";
import { fetchShopeePrice, formatBRL } from "@/lib/scrape-shopee";
import { Product } from "@/lib/affiliates";

/**
 * Confere na Shopee o preço dos produtos cadastrados e atualiza o que
 * mudou. Roda todo dia pela rota /api/cron/refresh-prices e também no
 * botão "Atualizar preços agora" do painel.
 */

export interface PriceChange {
  slug: string;
  title: string;
  from: string;
  to: string;
}

export interface PriceRefreshResult {
  checked: number;
  updated: number;
  unchanged: number;
  failed: number;
  skipped: number;
  changes: PriceChange[];
  failures: string[];
}

/** Quantos produtos no máximo por execução (a função tem tempo limitado). */
const MAX_PER_RUN = 25;
/** Respiro entre as consultas, para não bater na Shopee em rajada. */
const DELAY_MS = 400;

export async function refreshAllPrices(): Promise<PriceRefreshResult> {
  const all = await getAllProducts();

  const elegiveis = all.filter((p) => p.priceAutoUpdate !== false && p.networkProductId);
  // Começa pelos que estão sem conferir há mais tempo, para que rodadas
  // seguidas cubram o catálogo inteiro mesmo se ele passar do limite.
  const fila = elegiveis
    .slice()
    .sort((a, b) => (a.priceUpdatedAt ?? "").localeCompare(b.priceUpdatedAt ?? ""))
    .slice(0, MAX_PER_RUN);

  const result: PriceRefreshResult = {
    checked: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
    skipped: all.length - fila.length,
    changes: [],
    failures: [],
  };

  for (const product of fila) {
    if (result.checked > 0) await sleep(DELAY_MS);
    result.checked++;

    try {
      const value = await fetchShopeePrice(product.networkProductId);

      if (value === undefined) {
        result.failed++;
        result.failures.push(product.slug);
        continue;
      }

      if (isSamePrice(product, value)) {
        result.unchanged++;
        await touchPriceCheckedAt(product.slug, new Date().toISOString());
        continue;
      }

      const formatted = formatBRL(value);
      await updateProductPrice(product.slug, {
        price: formatted,
        priceValue: value,
        priceUpdatedAt: new Date().toISOString(),
      });

      result.updated++;
      result.changes.push({
        slug: product.slug,
        title: product.title,
        from: product.price,
        to: formatted,
      });
    } catch (err) {
      result.failed++;
      result.failures.push(product.slug);
      console.error(`[precos] falha em "${product.slug}"`, err);
    }
  }

  return result;
}

/**
 * Compara em centavos. Produtos antigos não têm `priceValue`, então
 * caímos na comparação do texto formatado.
 */
function isSamePrice(product: Product, value: number): boolean {
  if (typeof product.priceValue === "number") {
    return Math.round(product.priceValue * 100) === Math.round(value * 100);
  }
  return product.price.trim() === formatBRL(value);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
