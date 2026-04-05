import { buildPaginationItems } from "../PaginationControls";

describe("buildPaginationItems", () => {
  it("returns every page when total pages do not exceed the threshold", () => {
    expect(buildPaginationItems(3, 5, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps a constant number of visible slots when collapsing", () => {
    expect(buildPaginationItems(2, 14, 5)).toEqual([1, 2, 3, "ellipsis", 14]);
    expect(buildPaginationItems(7, 14, 5)).toEqual([
      1,
      "ellipsis",
      7,
      "ellipsis",
      14,
    ]);
    expect(buildPaginationItems(13, 14, 5)).toEqual([
      1,
      "ellipsis",
      12,
      13,
      14,
    ]);
  });

  it("expands nearby pages when the current page is close to an edge", () => {
    expect(buildPaginationItems(2, 10, 5)).toEqual([1, 2, 3, "ellipsis", 10]);
    expect(buildPaginationItems(9, 10, 5)).toEqual([1, "ellipsis", 8, 9, 10]);
  });
});
