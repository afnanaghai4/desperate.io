export type InputType = "TEXT" | "LINK";

export type Job = {
  jobId: number;
  userId: number;
  jobTitle: string | null;
  companyName: string | null;
  inputType: InputType;
  jobText: string | null;
  jobLink: string | null;
  createdAt: string;
};
