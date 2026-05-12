import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import JobAnalysisPanel from "./job-analysis-panel";
import { JobAnalysisResponse } from "@/types/job-analysis";

const analysisResult: JobAnalysisResponse = {
  matchPercentage: 76,
  extractedKeywords: {
    jobKeywords: ["React", "TypeScript", "Testing"],
    profileKeywords: ["React", "Testing"],
    matchedKeywords: ["React", "Testing", "Accessibility", "Next.js", "TypeScript", "Vitest"],
  },
  analysis: {
    strengths: ["Strong React experience"],
    weaknesses: ["Needs deeper backend exposure"],
  },
  projectRecommendations: [
    {
      title: "Accessible Jobs Dashboard",
      description: "Build a dashboard for tracking job applications.",
      timeline: "2 weeks",
      difficultyLevel: "INTERMEDIATE",
      skills: ["React", "Testing Library"],
      milestones: [
        {
          week: "Week 1",
          tasks: ["Create dashboard layout"],
          deliverable: "Dashboard prototype",
        },
      ],
      cvPoints: ["Built an accessible dashboard with tested workflows"],
      updatedInterviewPercentage: 88,
    },
  ],
};

describe("JobAnalysisPanel", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the no-analysis state", () => {
    render(<JobAnalysisPanel analysisResult={null} isLoading={false} />);

    expect(screen.getByRole("heading", { name: "Analysis Results" })).toBeInTheDocument();
    expect(screen.getByText("Your personalized insights")).toBeInTheDocument();
    expect(screen.getByText('No analysis yet. Click "Analyze" to get started.')).toBeInTheDocument();
  });

  it("renders the loading state", () => {
    render(<JobAnalysisPanel analysisResult={null} isLoading />);

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByText("Analyzing your job posting...")).toBeInTheDocument();
  });

  it("renders an error alert", () => {
    render(<JobAnalysisPanel analysisResult={null} isLoading={false} error="Analysis failed" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Analysis failed");
  });

  it("renders existing analysis results and recommendations", () => {
    render(<JobAnalysisPanel analysisResult={analysisResult} isLoading={false} />);

    expect(screen.getByText("Job Match Score")).toBeInTheDocument();
    expect(screen.getByText("76%")).toBeInTheDocument();
    expect(screen.getByText("Matched Keywords")).toBeInTheDocument();
    expect(screen.getAllByText("React").length).toBeGreaterThan(0);
    expect(screen.getByText("Testing")).toBeInTheDocument();
    expect(screen.getByText("+1 more")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recommended Projects (1)" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Accessible Jobs Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("INTERMEDIATE")).toBeInTheDocument();
  });

  it("renders empty keyword and recommendation states", () => {
    render(
      <JobAnalysisPanel
        analysisResult={{
          ...analysisResult,
          extractedKeywords: {
            jobKeywords: [],
            profileKeywords: [],
            matchedKeywords: [],
          },
          projectRecommendations: [],
        }}
        isLoading={false}
      />,
    );

    expect(screen.getByText("No keywords matched.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recommended Projects (0)" })).toBeInTheDocument();
    expect(screen.getByText("No project recommendations available.")).toBeInTheDocument();
  });
});
