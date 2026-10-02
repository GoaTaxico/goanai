import { publicModels } from "@/lib/catalog";
import { configuredModelIds } from "@/lib/models";

export function GET() {
  const ready = new Set(configuredModelIds());

  return Response.json({
    models: publicModels
      .filter((model) => ready.has(model.id))
      .map((model) => ({
        id: model.id,
        name: model.name,
        description: model.description,
      })),
  });
}
