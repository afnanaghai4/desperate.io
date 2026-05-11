/// <reference types="@testing-library/jest-dom" />

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("frontend test setup", () => {
  it("renders React components in jsdom", () => {
    render(<button type="button">Smoke test</button>);

    expect(screen.getByRole("button", { name: "Smoke test" })).toBeInTheDocument();
  });
});
