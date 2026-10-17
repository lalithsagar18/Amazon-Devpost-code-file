# LifePilot AI — 3-Minute Hackathon Demonstration Script

**Track**: Alexa+  
**Tagline**: *More than answers. AI that gets things done.*

---

## Act 1: The Problem & The Solution (0:00 – 0:35)

> **Speaker**:  
> "Hi everyone! Students and busy professionals are overwhelmed by fragmented schedules, scattered notes, and impending exam deadlines. Traditional voice assistants and conversational chatbots can give you answers, but they stop short of getting actual work done.
>
> Introducing **LifePilot AI** — an action-oriented AI productivity agent built for the Alexa+ hackathon track.
> LifePilot AI goes beyond conversation: it parses your intent, formulates multi-step plans, invokes official Model Context Protocol (MCP) tools, requests human approval before making consequential schedule changes, and verifies the outcome directly in your database."

*(Action: Show the LifePilot AI Dashboard with metrics, pending tasks, calendar commitments, and productivity charts).*

---

## Act 2: Workflow A — Task Prioritization with Transparent Reasoning (0:35 – 1:15)

> **Speaker**:  
> "Let's test our first workflow. In the AI Assistant prompt bar, we type:  
> *'Show my pending tasks and prioritize them.'*"

*(Action: Click send or use the Voice Demo microphone button).*

> **Speaker**:  
> "Notice what happened:
> 1. The agent queried active tasks from our local database.
> 2. It didn't just guess priorities—it applied an algorithmic scoring model evaluating deadline proximity, priority weighting, and duration.
> 3. It displays transparent reasoning for every item and recommends starting with our urgent deadline first.
> 4. We can expand the **MCP Tool Invocations** trace to inspect the exact machine-readable arguments."

---

## Act 3: Workflow B — Free-Time Discovery & Human Approval (1:15 – 2:05)

> **Speaker**:  
> "Now let's find time for focused work. We ask:  
> *'Find two free hours tomorrow for project work.'*"

*(Action: Submit the prompt in Chat).*

> **Speaker**:  
> "Notice the agent pipeline in action:
> - It inspected our internal calendar for tomorrow.
> - Excluded busy lecture and meeting commitments.
> - Identified a clear 2.5-hour afternoon opening and proposed a 2-hour focused work session from 12:30 PM to 2:30 PM.
> - **Crucially, because modifying your calendar is a consequential mutation, LifePilot AI stages an Approval Card and awaits our explicit consent.**
> 
> Let's click **Approve & Persist**."

*(Action: Click 'Approve & Persist' on the ApprovalCard).*

> **Speaker**:  
> "The action executes idempotently, verifies the inserted record from the database, and confirms the event. When we navigate to the **Schedule** tab, our new project work block is right there!"

---

## Act 4: Workflow C — Conflict-Free Exam Roadmap (2:05 – 2:45)

> **Speaker**:  
> "Now let's look at our third core capability: the Exam & Study Planner. In chat or on the Study Planner tab, we ask:  
> *'Plan my week around my exams.'*"

*(Action: Submit prompt).*

> **Speaker**:  
> "LifePilot AI analyzes the days remaining until our Calculus II exam, reviews our existing schedule, and generates four balanced 90-minute sessions. Each session is dynamically fitted into confirmed calendar openings to avoid conflicts.
> 
> Topics are sequenced progressively from foundational theory to mock problem sets. Once again, it asks for approval before bulk-persisting multiple sessions to our calendar."

---

## Act 5: Architecture & Conclusion (2:45 – 3:00)

> **Speaker**:  
> "Under the hood, LifePilot AI features:
> - Official Python MCP server with 14 tools running Streamable HTTP (spec version 2025-11-25).
> - Clean FastAPI backend with SQLite and PostgreSQL support.
> - A modern React 19 + Tailwind dashboard.
> - 100% automated test coverage across all three workflows.
> 
> LifePilot AI: More than answers. AI that gets things done. Thank you!"
