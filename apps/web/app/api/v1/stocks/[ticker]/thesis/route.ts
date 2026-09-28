import { getThesis, getTraits } from "@aido/db/traits";
import { bad, ok } from "../../../_lib";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker).toUpperCase();
  const [t, thesis] = await Promise.all([getTraits(ticker), getThesis(ticker)]);
  if (!t || !thesis) return bad("No thesis yet", 404);
  return ok({ ticker, score: thesis.score, action: thesis.action, confidence: thesis.confidence, why: thesis.why, keyRisk: thesis.keyRisk, thesis: thesis.thesis, engineVersion: thesis.engineVersion }, t.asOf);
}
