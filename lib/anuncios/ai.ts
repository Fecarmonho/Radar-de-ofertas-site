import "server-only";

/**
 * Chamada à camada gratuita da API do Gemini (Google AI Studio) — usada
 * pela área de Anúncios pra gerar gancho/legenda/hashtags/prompts com IA
 * de verdade em vez de template. Sem custo dentro do limite diário da
 * conta gratuita.
 */

/**
 * "2.0" ficou obsoleto e passou a devolver 404 no v1beta pouco depois de
 * lançado — a Google troca o modelo padrão da camada gratuita com
 * frequência. Se isso voltar a quebrar, confira o nome atual em
 * ai.google.dev/gemini-api/docs/pricing (procure "Free of charge").
 */
const MODEL = "gemini-3.6-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 15_000;

/**
 * Qualquer coisa que impeça de usar a IA agora (sem chave configurada,
 * rede, limite de uso do dia, resposta em formato inesperado) vira este
 * erro — quem chama decide cair pro template em vez de quebrar a tela.
 */
export class IAIndisponivelError extends Error {}

export async function chamarGeminiJSON<T>(prompt: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new IAIndisponivelError("GEMINI_API_KEY não configurada.");
  }

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.9 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (err) {
    throw new IAIndisponivelError(
      err instanceof Error ? err.message : "Falha de rede ao chamar a IA."
    );
  }

  if (!response.ok) {
    // 429 é o limite diário/por minuto da camada gratuita — acontece,
    // não é bug. O fallback pro template cobre esse caso também.
    throw new IAIndisponivelError(`Gemini respondeu ${response.status}.`);
  }

  const data = await response.json();
  const texto: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!texto) {
    throw new IAIndisponivelError("Resposta da IA veio vazia.");
  }

  // Já pedimos JSON puro (responseMimeType), mas o modelo às vezes
  // devolve envolto em ```json mesmo assim — tira por garantia.
  const limpo = texto.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();

  try {
    return JSON.parse(limpo) as T;
  } catch {
    throw new IAIndisponivelError("A IA respondeu num formato inesperado.");
  }
}
