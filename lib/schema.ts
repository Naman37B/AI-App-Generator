import { z } from "zod";

// 1. Define the valid UI components your frontend knows how to render
const ComponentSchema = z.object({
  id: z.string(),
  type: z.enum(["table", "form", "metric", "text"]).catch("text"), // Fallback to plain text if unknown component
  props: z.record(z.string(), z.any()).optional().default({}),
});

// 2. Define the virtual database schema
const FieldSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean", "date"]),
  required: z.boolean().default(false),
});

const ModelSchema = z.object({
  name: z.string(),
  fields: z.array(FieldSchema),
});

// 3. The Master App Configuration Schema
export const AppConfigSchema = z.object({
  appName: z.string().default("Untitled App"),
  dataModels: z.array(ModelSchema).default([]),
  pages: z.array(
    z.object({
      path: z.string(),
      title: z.string().default("Page"),
      components: z.array(ComponentSchema).default([]),
    })
  ).default([]),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;