/** Functions the live page calls, but which are not created by an old database. */
export const REQUIRED_DATABASE_FUNCTIONS = [
  { name: "delete_reagent", label: "删除试剂及库存" },
  { name: "create_restock_order_auto", label: "补货自动解锁" },
] as const;

/**
 * Read a PostgREST OpenAPI document for the signed-in role.
 * An incomplete document is treated as unknown, not as a missing patch,
 * so a network or schema-format change does not raise a false alarm.
 */
export function missingDatabaseFunctionsFromOpenApi(spec: string): string[] {
  if (!spec.includes("/rpc/save_reagent")) return [];
  return REQUIRED_DATABASE_FUNCTIONS.filter((item) => !spec.includes(`/rpc/${item.name}`)).map((item) => item.label);
}
