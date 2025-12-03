import type { Entry } from "@/types";
import { getAiOverview, isAiEnabled, type GeminiResponse } from "./gemini";

export class MagyarKozlonyApi {
  constructor() {}

  async loadLatest(count: 10): Promise<any> {}

  async getAiSummary(lines: Entry[]): Promise<GeminiResponse | undefined> {
    if (!isAiEnabled()) {
      return;
    }
    return getAiOverview(lines);
  }
}
