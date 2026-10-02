export const MODEL_SLUGS = ["swift", "pro", "reason"] as const;

export type ModelSlug = (typeof MODEL_SLUGS)[number];

export type PublicModel = {
  id: ModelSlug;
  name: string;
  description: {
    en: string;
    hi: string;
  };
};

export const publicModels: PublicModel[] = [
  {
    id: "swift",
    name: "Goan Swift",
    description: {
      en: "Fast everyday answers",
      hi: "रोज़मर्रा के तेज़ जवाब",
    },
  },
  {
    id: "pro",
    name: "Goan Pro",
    description: {
      en: "Stronger answers for harder questions",
      hi: "कठिन सवालों के बेहतर जवाब",
    },
  },
  {
    id: "reason",
    name: "Goan Reason",
    description: {
      en: "Careful, step-by-step answers",
      hi: "ध्यान से, कदम-दर-कदम जवाब",
    },
  },
];

export function isModelSlug(value: unknown): value is ModelSlug {
  return (
    typeof value === "string" &&
    MODEL_SLUGS.some((slug) => slug === value)
  );
}
