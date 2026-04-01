import { FAL_MODELS, getModelsByType, getModelById, type FalModelConfig } from "./models";

// Re-export from unified model catalog for client-side use
export { FAL_MODELS, getModelsByType, getModelById, type FalModelConfig };

// Client-safe model config (no API keys or server-only data)
export interface FalModelConfigClient {
  id: string;
  name: string;
  type: "IMAGE" | "VIDEO";
  category: string;
  description: string;
  pricing?: string;
}

export function getModelsByTypeClient(type: "IMAGE" | "VIDEO"): FalModelConfigClient[] {
  return getModelsByType(type).map((m) => ({
    id: m.id,
    name: m.name,
    type: m.type,
    category: m.category,
    description: m.description,
    pricing: m.pricing,
  }));
}

export function getModelByIdClient(modelId: string): FalModelConfigClient | undefined {
  const model = getModelById(modelId);
  if (!model) return undefined;
  return {
    id: model.id,
    name: model.name,
    type: model.type,
    category: model.category,
    description: model.description,
    pricing: model.pricing,
  };
}