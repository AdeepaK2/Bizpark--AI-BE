export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// Compatibility namespace so existing imports like `Prisma.InputJsonValue` keep compiling.
export namespace Prisma {
    export type InputJsonValue = JsonValue;
    export type InputJsonObject = JsonObject;
}
