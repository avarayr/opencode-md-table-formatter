import { describe, it, expect } from "bun:test";
import { formatMarkdownTables } from "../index";

describe("formatMarkdownTables", () => {
	describe("box-drawing output", () => {
		it("should format a simple table with box-drawing characters", () => {
			const input = `| Feature | Status | Notes |
|---------|--------|-------|
| Bold    | Active | v2.0  |`;

			const output = formatMarkdownTables(input);

			expect(output).toContain("┌");
			expect(output).toContain("┐");
			expect(output).toContain("└");
			expect(output).toContain("┘");
			expect(output).toContain("│");
			expect(output).toContain("─");
			expect(output).toContain("├");
			expect(output).toContain("┤");
			expect(output).toContain("┼");
		});

		it("should generate correct structure for a simple table", () => {
			const input = `| A | B |
|---|---|
| 1 | 2 |`;

			const output = formatMarkdownTables(input);
			const lines = output.split("\n");

			expect(lines.length).toBe(5); // top border, header, separator, data row, bottom border
			expect(lines[0]).toMatch(/^┌─+┬─+┐$/);
			expect(lines[1]).toMatch(/^│.*│.*│$/);
			expect(lines[2]).toMatch(/^├─+┼─+┤$/);
			expect(lines[3]).toMatch(/^│.*│.*│$/);
			expect(lines[4]).toMatch(/^└─+┴─+┘$/);
		});

		it("should not include markdown separator row in output", () => {
			const input = `| Header |
|--------|
| Cell   |`;

			const output = formatMarkdownTables(input);

			expect(output).not.toContain("|---|");
			expect(output).not.toContain("----");
		});
	});

	describe("alignment", () => {
		it("should preserve left alignment", () => {
			const input = `| Left |
|:-----|
| A    |
| Long |`;

			const output = formatMarkdownTables(input);
			const lines = output.split("\n");

			// Data rows should have content left-aligned (content followed by spaces)
			expect(lines[3]).toContain("│ A   ");
			expect(lines[4]).toContain("│ Long");
		});

		it("should preserve right alignment", () => {
			const input = `| Right |
|------:|
| A     |
| Long  |`;

			const output = formatMarkdownTables(input);
			const lines = output.split("\n");

			// Data rows should have content right-aligned (spaces followed by content)
			expect(lines[3]).toContain("   A │");
			expect(lines[4]).toContain("Long │");
		});

		it("should preserve center alignment", () => {
			const input = `| Center |
|:------:|
| A      |
| Long   |`;

			const output = formatMarkdownTables(input);
			const lines = output.split("\n");

			// Center alignment - content should have padding on both sides
			expect(lines[3]).toMatch(/│\s+A\s+│/);
		});

		it("should handle mixed alignments", () => {
			const input = `| Left | Center | Right |
|:-----|:------:|------:|
| A    | B      | C     |`;

			const output = formatMarkdownTables(input);

			expect(output).toContain("│ Left");
			expect(output).toContain("Right │");
		});
	});

	describe("multiple rows", () => {
		it("should format tables with multiple data rows", () => {
			const input = `| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
| Charlie | 35 |`;

			const output = formatMarkdownTables(input);
			const lines = output.split("\n");

			expect(lines.length).toBe(7); // top, header, separator, 3 data rows, bottom
			expect(output).toContain("Alice");
			expect(output).toContain("Bob");
			expect(output).toContain("Charlie");
		});

		it("should align columns based on widest content", () => {
			const input = `| X | Y |
|---|---|
| Short | A |
| VeryLongContent | B |`;

			const output = formatMarkdownTables(input);
			const lines = output.split("\n");

			// All rows should have same width
			const rowLengths = lines.map((l) => l.length);
			expect(new Set(rowLengths).size).toBe(1);
		});
	});

	describe("edge cases", () => {
		it("should handle empty cells", () => {
			const input = `| A | B |
|---|---|
|   | X |`;

			const output = formatMarkdownTables(input);

			// Empty cell gets padded to match column width
			expect(output).toContain("│     │");
		});

		it("should preserve non-table content", () => {
			const input = `Some text before

| A | B |
|---|---|
| 1 | 2 |

Some text after`;

			const output = formatMarkdownTables(input);

			expect(output).toContain("Some text before");
			expect(output).toContain("Some text after");
			expect(output).toContain("┌");
		});

		it("should handle tables with many columns", () => {
			const input = `| A | B | C | D | E |
|---|---|---|---|---|
| 1 | 2 | 3 | 4 | 5 |`;

			const output = formatMarkdownTables(input);
			const lines = output.split("\n");

			// Count the number of column separators (should be 4 internal + 2 edges = 6 vertical bars per row)
			const topBorder = lines[0];
			const teeCount = (topBorder.match(/┬/g) || []).length;
			expect(teeCount).toBe(4);
		});

		it("should not format invalid tables", () => {
			const input = `| A | B |
| 1 | 2 |`;

			const output = formatMarkdownTables(input);

			// Should not have box drawing (no separator row = invalid)
			expect(output).toContain("<!-- table not formatted");
		});

		it("should handle tables with inconsistent column counts gracefully", () => {
			const input = `| A | B |
|---|---|
| 1 |`;

			const output = formatMarkdownTables(input);

			// Invalid table - inconsistent columns
			expect(output).toContain("<!-- table not formatted");
		});
	});

	describe("markdown content in cells", () => {
		it("should preserve bold text in cells", () => {
			const input = `| Header |
|--------|
| **bold** |`;

			const output = formatMarkdownTables(input);

			expect(output).toContain("**bold**");
		});

		it("should preserve italic text in cells", () => {
			const input = `| Header |
|--------|
| *italic* |`;

			const output = formatMarkdownTables(input);

			expect(output).toContain("*italic*");
		});

		it("should preserve inline code in cells", () => {
			const input = `| Header |
|--------|
| \`code\` |`;

			const output = formatMarkdownTables(input);

			expect(output).toContain("`code`");
		});
	});
});
