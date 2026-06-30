import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AcademicDetails from "./academic-details";
import { type AcademicFormData } from "./profile-types";

const baseEducation: AcademicFormData = {
  id: "0",
  instituteName: "TU Berlin",
  degreeName: "MSc",
  fieldOfStudy: "Computer Science",
  startDate: "2021-10-01",
  endDate: "2023-09-30",
  currentlyAttending: false,
  gradeCgpa: "1.7",
  description: "Distributed systems",
};

function StatefulAcademicDetails({
  initialData = [baseEducation],
}: {
  initialData?: AcademicFormData[];
}) {
  const [data, setData] = useState(initialData);

  return (
    <AcademicDetails
      data={data}
      setData={setData}
      onContinue={vi.fn()}
      onGoBack={vi.fn()}
    />
  );
}

describe("AcademicDetails", () => {
  afterEach(() => {
    cleanup();
  });

  it("adds and deletes education cards", async () => {
    const user = userEvent.setup();
    render(<StatefulAcademicDetails />);

    expect(screen.getByRole("heading", { name: "Education 1" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Education" }));

    expect(screen.getByRole("heading", { name: "Education 2" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete education 2" }));

    expect(screen.queryByRole("heading", { name: "Education 2" })).not.toBeInTheDocument();
  });

  it("clears and disables end date when currently attending is checked", async () => {
    const user = userEvent.setup();
    render(<StatefulAcademicDetails />);
    const endDateInput = screen.getByLabelText("End Date");

    expect(endDateInput).toHaveValue("2023-09-30");

    await user.click(screen.getByLabelText("Currently Attending"));

    expect(endDateInput).toBeDisabled();
    expect(endDateInput).toHaveValue("");
  });
});
