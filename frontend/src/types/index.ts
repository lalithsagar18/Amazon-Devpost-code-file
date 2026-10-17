export interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  estimated_duration: number;
  category: string;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PrioritizedTaskItem {
  task: Task;
  urgency_score: number;
  reason: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  event_type: 'study' | 'lecture' | 'project' | 'meeting' | 'personal';
  is_confirmed: boolean;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  available_window_minutes?: number;
  date_str: string;
  formatted_start: string;
  formatted_end: string;
  recommendation_note: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string;
  is_seed: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExtractedTaskCandidate {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_duration: number;
  category: string;
}

export interface ProposedStudySession {
  title: string;
  subject: string;
  topic: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  focus_objective: string;
  requires_approval: boolean;
}

export interface StudyPlanResponse {
  subject: string;
  exam_date: string;
  days_until_exam: number;
  total_study_hours: number;
  sessions: ProposedStudySession[];
  reasoning: string;
  approval_required: boolean;
}

export interface Approval {
  id: number;
  run_id?: number;
  action_type: string;
  title: string;
  description: string;
  proposed_payload: Record<string, any>;
  affected_records_summary?: string;
  status: 'pending' | 'approved' | 'cancelled' | 'executed' | 'failed';
  idempotency_token?: string;
  execution_result?: Record<string, any>;
  verified_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AgentRun {
  id: number;
  conversation_id?: string;
  user_prompt: string;
  intent?: string;
  status: 'pending' | 'planning' | 'awaiting_approval' | 'executing' | 'completed' | 'failed' | 'cancelled';
  plan?: Array<{
    step_number: number;
    description: string;
    tool_name?: string;
    status: string;
  }>;
  tool_calls?: Array<{
    tool_name: string;
    arguments: Record<string, any>;
    status: string;
    [key: string]: any;
  }>;
  summary?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  extra_data?: Record<string, any>;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
}

export interface ToolInfo {
  name: string;
  description: string;
  category: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  requires_approval: boolean;
  consequential: boolean;
}
