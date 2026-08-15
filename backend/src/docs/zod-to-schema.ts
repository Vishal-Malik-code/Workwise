import { z, type ZodTypeAny } from "zod";

// zod-openapi's automatic schema conversion targets zod v4's internal shape
// and doesn't work against the zod v3 objects this project still uses (see
// the zod-openapi dependency note in package.json). This is a small,
// deliberately partial converter covering the shapes our validators
// actually use (object/string/number/boolean/enum/optional/nullable/
// default/array) so /api-docs.json renders real JSON Schema instead of
// zod's raw internal `_def` structure.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zodToSchema(schema: ZodTypeAny): Record<string, any> {
  if (schema instanceof z.ZodOptional || schema instanceof z.ZodNullable) {
    return zodToSchema(schema.unwrap());
  }
  if (schema instanceof z.ZodDefault) {
    return { ...zodToSchema(schema._def.innerType), default: schema._def.defaultValue() };
  }
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, ZodTypeAny>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodToSchema(value);
      if (!value.isOptional()) required.push(key);
    }
    return { type: "object", properties, ...(required.length ? { required } : {}) };
  }
  if (schema instanceof z.ZodEnum) {
    return { type: "string", enum: schema.options };
  }
  if (schema instanceof z.ZodString) {
    return { type: "string" };
  }
  if (schema instanceof z.ZodNumber) {
    return { type: "number" };
  }
  if (schema instanceof z.ZodBoolean) {
    return { type: "boolean" };
  }
  if (schema instanceof z.ZodRecord) {
    return { type: "object" };
  }
  if (schema instanceof z.ZodArray) {
    return { type: "array", items: zodToSchema(schema.element) };
  }
  return {};
}
