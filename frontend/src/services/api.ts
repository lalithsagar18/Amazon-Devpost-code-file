import {
  Task, PrioritizedTaskItem, CalendarEvent, TimeSlot,
  Note, StudyPlanResponse, Approval, AgentRun,
  Conversation, ToolInfo
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || errorBody.message || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // System Health
  async getHealth(): Promise<any> {
    const res = await fetch('http://localhost:8000/health');
    return handleResponse(res);
  },

  // Tasks
  async getTasks(params?: { status?: string; priority?: string; category?: string; search?: string; sort_by?: string }): Promise<Task[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.sort_by) query.append('sort_by', params.sort_by);
    
    const res = await fetch(`${API_BASE}/tasks?${query.toString()}`);
    return handleResponse<Task[]>(res);
  },

  async getPrioritizedTasks(): Promise<PrioritizedTaskItem[]> {
    const res = await fetch(`${API_BASE}/tasks/prioritized`);
    return handleResponse<PrioritizedTaskItem[]>(res);
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return handleResponse<Task>(res);
  },

  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return handleResponse<Task>(res);
  },

  async completeTask(id: number): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}/complete`, { method: 'POST' });
    return handleResponse<Task>(res);
  },

  async reopenTask(id: number): Promise<Task> {
    const res = await fetch(`${API_BASE}/tasks/${id}/reopen`, { method: 'POST' });
    return handleResponse<Task>(res);
  },

  async deleteTask(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  // Calendar
  async getEvents(params?: { start_date?: string; end_date?: string; event_type?: string }): Promise<CalendarEvent[]> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.event_type) query.append('event_type', params.event_type);
    
    const res = await fetch(`${API_BASE}/calendar/events?${query.toString()}`);
    return handleResponse<CalendarEvent[]>(res);
  },

  async createEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const res = await fetch(`${API_BASE}/calendar/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return handleResponse<CalendarEvent>(res);
  },

  async updateEvent(id: number, event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const res = await fetch(`${API_BASE}/calendar/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    return handleResponse<CalendarEvent>(res);
  },

  async deleteEvent(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/calendar/events/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  async findFreeTime(dateStr: string, durationMinutes = 120): Promise<{ requested_date: string; available_slots: TimeSlot[]; busy_events_count: number }> {
    const res = await fetch(`${API_BASE}/calendar/find-free-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: dateStr, duration_minutes: durationMinutes }),
    });
    return handleResponse(res);
  },

  // Notes
  async getNotes(params?: { search?: string; tag?: string }): Promise<Note[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.tag) query.append('tag', params.tag);
    const res = await fetch(`${API_BASE}/notes?${query.toString()}`);
    return handleResponse<Note[]>(res);
  },

  async createNote(note: Partial<Note>): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return handleResponse<Note>(res);
  },

  async updateNote(id: number, note: Partial<Note>): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    return handleResponse<Note>(res);
  },

  async deleteNote(id: number): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    return handleResponse<{ success: boolean }>(res);
  },

  async summarizeNote(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/notes/${id}/summarize`);
    return handleResponse(res);
  },

  async extractTasksFromNote(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/notes/${id}/extract-tasks`, { method: 'POST' });
    return handleResponse(res);
  },

  // Study Planner
  async generateStudyPlan(planReq: { subject: string; exam_date: string; available_hours_per_day?: number; target_sessions_count?: number; topics?: string[] }): Promise<StudyPlanResponse> {
    const res = await fetch(`${API_BASE}/study-planner/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(planReq),
    });
    return handleResponse<StudyPlanResponse>(res);
  },

  // Chat & AI Assistant
  async sendChatMessage(message: string, conversationId?: string, voiceInput = false): Promise<any> {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversation_id: conversationId, voice_input: voiceInput }),
    });
    return handleResponse(res);
  },

  async getConversations(): Promise<Conversation[]> {
    const res = await fetch(`${API_BASE}/conversations`);
    return handleResponse<Conversation[]>(res);
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await fetch(`${API_BASE}/conversations/${id}`);
    return handleResponse<Conversation>(res);
  },

  // Approvals & Safety
  async getApprovals(status?: string): Promise<Approval[]> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/approvals${query}`);
    return handleResponse<Approval[]>(res);
  },

  async approveAction(id: number, idempotencyToken?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/approvals/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotency_token: idempotencyToken }),
    });
    return handleResponse(res);
  },

  async cancelAction(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/approvals/${id}/cancel`, { method: 'POST' });
    return handleResponse(res);
  },

  // Agent Runs
  async getAgentRuns(status?: string): Promise<AgentRun[]> {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/agent/runs${query}`);
    return handleResponse<AgentRun[]>(res);
  },

  // Tools & MCP
  async getTools(): Promise<ToolInfo[]> {
    const res = await fetch(`${API_BASE}/tools`);
    return handleResponse<ToolInfo[]>(res);
  },

  async getToolsHealth(): Promise<any> {
    const res = await fetch(`${API_BASE}/tools/health`);
    return handleResponse(res);
  },

  async executeTool(toolName: string, payload: Record<string, any>): Promise<any> {
    const res = await fetch(`${API_BASE}/tools/execute/${toolName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  // Seed Data
  async initializeSeed(): Promise<any> {
    const res = await fetch(`${API_BASE}/seed/initialize`, { method: 'POST' });
    return handleResponse(res);
  },

  async resetSeed(): Promise<any> {
    const res = await fetch(`${API_BASE}/seed/reset`, { method: 'POST' });
    return handleResponse(res);
  },
};
