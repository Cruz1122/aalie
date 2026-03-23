import type { SnapshotSection, SnapshotSectionStatus, SnapshotWarning } from "@aa/types";

export function createSection<T>(
  status: SnapshotSectionStatus,
  data?: T,
  warnings?: SnapshotWarning[],
  todos?: string[],
): SnapshotSection<T> {
  const section: SnapshotSection<T> = { status };
  if (typeof data !== "undefined") section.data = data;
  if (warnings && warnings.length > 0) section.warnings = warnings;
  if (todos && todos.length > 0) section.todos = todos;
  return section;
}

export function markNotImplemented<T>(todo: string): SnapshotSection<T> {
  return createSection<T>("not_implemented", undefined, undefined, [todo]);
}

export function markMissingData<T>(warning: SnapshotWarning): SnapshotSection<T> {
  return createSection<T>("missing_data", undefined, [warning]);
}

export function isSectionAvailable<T>(section: SnapshotSection<T>): section is SnapshotSection<T> & { data: T } {
  return section.status === "available" && typeof section.data !== "undefined";
}
