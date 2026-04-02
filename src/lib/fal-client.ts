// Client-safe re-exports from models catalog
// Do NOT import server-only utilities here

import {
  FAL_MODELS,
  getModelById,
  getModelsByGroup,
  getAssetType,
  MODEL_TYPE_LABELS,
  type FalModelConfig,
  type ModelType,
  type ModelParam,
  type ParamType,
  type SelectOption,
} from "./models";

export {
  FAL_MODELS,
  getModelById,
  getModelsByGroup,
  getAssetType,
  MODEL_TYPE_LABELS,
  type FalModelConfig,
  type ModelType,
  type ModelParam,
  type ParamType,
  type SelectOption,
};

export function getModelsByTypeClient(modelType: ModelType): FalModelConfig[] {
  return FAL_MODELS.filter((m) => m.modelType === modelType);
}

export function getModelByIdClient(id: string): FalModelConfig | undefined {
  return getModelById(id);
}
