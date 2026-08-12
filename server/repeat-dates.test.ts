import { describe, expect, it } from "vitest";
import {
  buildEventDates,
  commitRepeatDates,
  toggleRepeatDate,
} from "../client/src/lib/repeatDates";

describe("repeat-date selection", () => {
  it("adds an unselected date and removes it when clicked again", () => {
    const first = toggleRepeatDate(new Set<string>(), "2026-08-12", "2026-08-05");
    expect(Array.from(first)).toEqual(["2026-08-12"]);

    const second = toggleRepeatDate(first, "2026-08-12", "2026-08-05");
    expect(Array.from(second)).toEqual([]);
  });

  it("does not allow the primary event date to become a duplicate", () => {
    const selected = toggleRepeatDate(
      new Set<string>(),
      "2026-08-05",
      "2026-08-05",
    );
    expect(Array.from(selected)).toEqual([]);
  });

  it("commits all selected dates in stable order and excludes the primary date", () => {
    const dates = commitRepeatDates(
      new Set(["2026-08-20", "2026-08-05", "2026-08-12"]),
      "2026-08-05",
    );
    expect(dates).toEqual(["2026-08-12", "2026-08-20"]);
  });

  it("builds a deduplicated submission array while preserving single-day behavior", () => {
    expect(buildEventDates("2026-08-05", [], false)).toEqual(["2026-08-05"]);
    expect(
      buildEventDates(
        "2026-08-05",
        ["2026-08-20", "2026-08-12", "2026-08-20", "", "2026-08-05"],
        true,
      ),
    ).toEqual(["2026-08-05", "2026-08-20", "2026-08-12"]);
  });
});
