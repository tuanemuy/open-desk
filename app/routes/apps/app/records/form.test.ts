import { describe, expect, it } from "vitest";
import type { FieldValue } from "@/core/domain/record/valueObject";
import {
  emptyRecordFormValues,
  toCreateRecordFieldValues,
  toRecordFormValues,
  toUpdateRecordFieldValues,
} from "./form";

describe("record form helpers", () => {
  it("returns a blank default value object", () => {
    expect(emptyRecordFormValues()).toEqual({
      company: "",
      department: "",
      person: "",
      postalCode: "",
      tel: "",
      fax: "",
      address: "",
      rank: "",
      email: "",
      notes: "",
    });
  });

  it("converts record field values into form values", () => {
    const fieldValues = new Map<string, FieldValue>([
      ["company_name", { type: "SINGLE_LINE_TEXT", value: "Acme" }],
      ["department", { type: "SINGLE_LINE_TEXT", value: "Sales" }],
      ["contact_name", { type: "SINGLE_LINE_TEXT", value: "Alice" }],
      ["postal_code", { type: "SINGLE_LINE_TEXT", value: "1234567" }],
      ["tel", { type: "SINGLE_LINE_TEXT", value: "0312345678" }],
      ["fax", { type: "SINGLE_LINE_TEXT", value: "0398765432" }],
      ["address", { type: "SINGLE_LINE_TEXT", value: "Tokyo" }],
      ["customer_rank", { type: "DROP_DOWN", value: "A" }],
      ["email", { type: "SINGLE_LINE_TEXT", value: "a@example.com" }],
      ["notes", { type: "MULTI_LINE_TEXT", value: "line 1\nline 2" }],
    ]);

    expect(toRecordFormValues(fieldValues)).toEqual({
      company: "Acme",
      department: "Sales",
      person: "Alice",
      postalCode: "1234567",
      tel: "0312345678",
      fax: "0398765432",
      address: "Tokyo",
      rank: "A",
      email: "a@example.com",
      notes: "line 1\nline 2",
    });
  });

  it("omits empty fields when building create payloads", () => {
    expect(
      toCreateRecordFieldValues({
        company: "Acme",
        department: "",
        person: undefined,
        postalCode: "",
        tel: "0312345678",
        fax: undefined,
        address: "Tokyo",
        rank: "A",
        email: "",
        notes: undefined,
      }),
    ).toEqual(
      new Map<string, FieldValue>([
        ["company_name", { type: "SINGLE_LINE_TEXT", value: "Acme" }],
        ["tel", { type: "SINGLE_LINE_TEXT", value: "0312345678" }],
        ["address", { type: "SINGLE_LINE_TEXT", value: "Tokyo" }],
        ["customer_rank", { type: "DROP_DOWN", value: "A" }],
      ]),
    );
  });

  it("joins array field values with commas and falls back to empty string for null or missing keys", () => {
    const fieldValues = new Map<string, FieldValue>([
      ["company_name", { type: "SINGLE_LINE_TEXT", value: "Acme" }],
      [
        "customer_rank",
        { type: "CHECK_BOX", value: ["A", "B"] } as unknown as FieldValue,
      ],
      ["department", { type: "DATE", value: null } as unknown as FieldValue],
      // notes は意図的に未登録 → 既定で "" が返ること
    ]);

    const values = toRecordFormValues(fieldValues);

    expect(values.company).toBe("Acme");
    expect(values.rank).toBe("A, B");
    expect(values.department).toBe("");
    expect(values.notes).toBe("");
  });

  it("returns empty string for non-string object or object array values", () => {
    const fieldValues = new Map<string, FieldValue>([
      [
        "company_name",
        {
          type: "CREATOR",
          value: { id: "u-1", name: "Alice" },
        } as unknown as FieldValue,
      ],
      [
        "department",
        {
          type: "USER_SELECT",
          value: [{ id: "u-2", name: "Bob" }],
        } as unknown as FieldValue,
      ],
    ]);

    const values = toRecordFormValues(fieldValues);

    expect(values.company).toBe("");
    expect(values.department).toBe("");
  });

  it("keeps empty strings when building update payloads", () => {
    expect(
      toUpdateRecordFieldValues({
        company: "",
        department: "",
        person: "",
        postalCode: "",
        tel: "",
        fax: "",
        address: "",
        rank: "",
        email: "",
        notes: "",
      }),
    ).toEqual(
      new Map<string, FieldValue>([
        ["company_name", { type: "SINGLE_LINE_TEXT", value: "" }],
        ["department", { type: "SINGLE_LINE_TEXT", value: "" }],
        ["contact_name", { type: "SINGLE_LINE_TEXT", value: "" }],
        ["postal_code", { type: "SINGLE_LINE_TEXT", value: "" }],
        ["tel", { type: "SINGLE_LINE_TEXT", value: "" }],
        ["fax", { type: "SINGLE_LINE_TEXT", value: "" }],
        ["address", { type: "SINGLE_LINE_TEXT", value: "" }],
        ["customer_rank", { type: "DROP_DOWN", value: "" }],
        ["email", { type: "SINGLE_LINE_TEXT", value: "" }],
        ["notes", { type: "MULTI_LINE_TEXT", value: "" }],
      ]),
    );
  });
});
