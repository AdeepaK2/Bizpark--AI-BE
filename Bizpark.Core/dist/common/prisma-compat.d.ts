export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = {
    [key: string]: JsonValue;
};
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export declare namespace Prisma {
    type InputJsonValue = JsonValue;
    type InputJsonObject = JsonObject;
}
