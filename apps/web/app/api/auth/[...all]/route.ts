import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@aido/auth/auth";

export const { GET, POST } = toNextJsHandler(auth);
export const dynamic = "force-dynamic";
