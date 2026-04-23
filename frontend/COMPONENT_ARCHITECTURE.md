# Job Analysis Page - Component Architecture

## 📐 Component Structure

```
JobAnalysisLayout (Main Container)
├── JobAnalysisForm (Left Side)
│   ├── JobInputToggle
│   ├── InputField (Company, Title, Description/Link)
│   ├── ActionButtons
│   │   ├── Save Button (Type: submit)
│   │   └── Analyze Button (Type: button)
│   └── Error Messages
│
└── JobAnalysisPanel (Right Side)
    ├── AnalysisLoadingState (When isLoading)
    │   ├── Blurred Placeholder Content
    │   └── Spinner + Loading Text
    │
    └── Analysis Results (When analysisResult exists)
        ├── AnalysisMetrics
        │   ├── Match Percentage (0-100%)
        │   ├── Progress Bar
        │   └── Matched Keywords (First 5 + counter)
        │
        └── ProjectRecommendationCard[] (3-4 cards)
            ├── Card Header (Always Visible)
            │   ├── Project Title
            │   ├── Difficulty Badge
            │   ├── Timeline
            │   └── Chevron Icon (Toggle)
            │
            └── Expandable Content
                ├── Description
                ├── Skills Required
                ├── ProjectMilestones
                │   └── Milestone[] (Nested Collapsible)
                │       ├── Week
                │       ├── Tasks List
                │       └── Deliverable
                ├── CV Points
                └── Interview Match Percentage
```

## 📁 File Structure

```
frontend/components/job/
├── job-analysis-layout.tsx          [Main coordinator]
├── job-analysis-form.tsx            [Left: Form + Buttons]
├── action-buttons.tsx               [Save/Analyze Buttons]
├── job-analysis-panel.tsx           [Right: Results]
├── analysis-loading-state.tsx       [Loading with blur + spinner]
├── analysis-metrics.tsx             [Match % + Keywords]
├── project-recommendation-card.tsx  [Collapsible project card]
├── project-milestones.tsx           [Nested collapsible milestones]
├── job-input-toggle.tsx             [Existing - reused]
├── job-form.tsx                     [Existing - kept for reference]
│
└── ../.. 
    ├── types/
    │   ├── job.ts                   [Existing - reused]
    │   └── job-analysis.ts          [NEW: Analysis response types]
    │
    └── lib/
        └── job-api.ts               [Updated: Added analyzeJob()]

app/jobs/create/page.tsx             [Updated: Uses JobAnalysisLayout]
```

## 🔄 State Flow

```
1. User enters job details in JobAnalysisForm
   ↓
2. Click "Save" → Calls createJob API
   ↓
3. Response: jobId stored in parent (JobAnalysisLayout) via onSave
   ↓
4. "Analyze" button becomes enabled
   ↓
5. Click "Analyze" → 
   - isLoading = true
   - JobAnalysisPanel shows AnalysisLoadingState (blur + spinner)
   ↓
6. API call to /analysis/analyze-fit with jobId
   ↓
7. Response received → 
   - isLoading = false
   - analysisResult populated
   - JobAnalysisPanel shows AnalysisMetrics + Cards
```

## 🎨 UI Breakdown

### Left Side (Form)
- White card with rounded corners
- Company name (optional)
- Job title (optional)  
- Job description or link (required, min 10 chars)
- Save + Analyze buttons (horizontal)
- Error display area

### Right Side (Results) - 3 States

#### State 1: Empty
```
"No analysis yet. Click 'Analyze' to get started."
```

#### State 2: Loading
```
┌─────────────────────────┐
│                         │ [Blur effect + Spinner overlay]
│    [SPINNER + TEXT]     │
│   "Analyzing your...    │
│                         │
└─────────────────────────┘
```

#### State 3: Loaded
```
┌─────────────────────────┐
│ Match Score: 75% (bar)  │ [Metrics section]
│ Keywords: [tag] [tag]   │
├─────────────────────────┤
│ Project 1 Title         │ [Card Header]
│ [MEDIUM] ⏱️ 4 weeks    │
├─────────────────────────┤
│ ▼ Description           │ [Expanded Content]
│   Skills: [tag] [tag]   │
│   Milestones:           │
│   ▼ Week 1              │
│     Tasks, Deliverable  │
│   ▼ Week 2              │
│   CV Points: •          │
│   Interview: 82%        │
└─────────────────────────┘
[... more cards]
```

## 💻 Key Features Implemented

✅ Two-button layout (Save + Analyze)
✅ Split-screen responsive design (1 col mobile, 2 col desktop)
✅ Loading state with blur effect + animated spinner
✅ Collapsible project cards (click header to expand)
✅ Nested collapsible milestones within projects
✅ Match percentage with visual progress bar
✅ Keyword tags (first 5 + counter for more)
✅ Difficulty badges (color-coded)
✅ Full project details: description, skills, timeline, CV points
✅ Interview match percentage display

## 🔌 API Integration

### Endpoint 1: Save Job
```
POST /jobs
Payload: {
  inputType: "TEXT" | "LINK",
  jobTitle?: string,
  companyName?: string,
  jobText?: string,
  jobLink?: string
}
Response: {
  data: { jobId: number, ... }
}
```

### Endpoint 2: Analyze Job
```
POST /analysis/analyze-fit
Payload: {
  jobId: number
}
Response: {
  matchPercentage: 0-100,
  extractedKeywords: {
    jobKeywords: string[],
    profileKeywords: string[],
    matchedKeywords: string[]
  },
  analysis: {
    strengths: string[],
    weaknesses: string[]
  },
  projectRecommendations: [
    {
      title: string,
      description: string,
      timeline: string,
      difficultyLevel: "EASY" | "MEDIUM" | "HARD",
      skills: string[],
      milestones: [
        {
          week: string,
          tasks: string[],
          deliverable: string
        }
      ],
      cvPoints: string[],
      updatedInterviewPercentage: number
    }
  ]
}
```

## 🛠️ Customization Points

### Colors
- Primary buttons: `bg-blue-600`
- Analyze button: `bg-purple-600`
- Match percentage: `from-blue-500 to-indigo-600`
- Keywords: `bg-blue-100 text-blue-800`
- Success states: `bg-green-100 text-green-800`

### Sizing
- Form card width: Full width on mobile, half on desktop
- Project cards: Full width
- Matched keywords display: First 5 + counter (adjust in analysis-metrics.tsx)

### Animation
- Spinner: `animate-spin` (Tailwind)
- Progress bar: `transition-all duration-500`
- Chevron rotation: `transition-transform`

## 🚀 Future Enhancements

- [ ] Save analysis results to database
- [ ] Compare multiple job analyses
- [ ] Export analysis as PDF
- [ ] Share analysis link
- [ ] Add filter/sort for projects by difficulty/timeline
- [ ] Show strengths/weaknesses in a separate section
