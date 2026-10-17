import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Wrench,
  Bot,
  Send,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { VoiceInputButton } from '../components/common/VoiceInputButton';
import { api } from '../services/api';
import { Task, CalendarEvent, PrioritizedTaskItem, AgentRun } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [prioritizedTasks, setPrioritizedTasks] = useState<PrioritizedTaskItem[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [recentRuns, setRecentRuns] = useState<AgentRun[]>([]);
  const [commandInput, setCommandInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksData, priData, eventsData, runsData] = await Promise.all([
        api.getTasks(),
        api.getPrioritizedTasks(),
        api.getEvents(),
        api.getAgentRuns(),
      ]);
      setTasks(tasksData);
      setPrioritizedTasks(priData);
      setEvents(eventsData);
      setRecentRuns(runsData);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    navigate('/chat', { state: { initialPrompt: commandInput } });
  };

  const pendingTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const now = new Date();
  const overdueTasks = pendingTasks.filter((t) => t.due_date && new Date(t.due_date) < now);

  // Mock chart data showing realistic daily productivity hours
  const productivityData = [
    { day: 'Mon', study: 3.5, project: 2.0 },
    { day: 'Tue', study: 2.0, project: 4.0 },
    { day: 'Wed', study: 4.5, project: 1.5 },
    { day: 'Thu', study: 3.0, project: 3.0 },
    { day: 'Fri', study: 5.0, project: 2.5 },
    { day: 'Sat', study: 4.0, project: 4.0 },
    { day: 'Sun', study: 2.5, project: 3.5 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Greeting & AI Command Bar */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy-900 via-navy-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Alexa+ Action Assistant</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome back! What should we accomplish today?
          </h2>
          <p className="text-slate-300 text-xs md:text-sm mt-1 mb-6">
            LifePilot AI identifies your schedule gaps, prioritizes pending deadlines, and executes approved operations.
          </p>

          {/* Quick AI Command Input */}
          <form onSubmit={handleCommandSubmit} className="relative flex items-center">
            <input
              type="text"
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
              placeholder="Type an instruction, e.g., 'Find two free hours tomorrow for project work'..."
              className="w-full bg-white text-slate-800 pl-4 pr-32 py-3.5 rounded-xl shadow-lg border border-slate-200 text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <VoiceInputButton onTranscript={(txt) => setCommandInput(txt)} />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Workflow Chips */}
          <div className="mt-3 flex items-center gap-2 flex-wrap text-[11px] text-slate-300">
            <span className="text-slate-400 font-medium">Try asking:</span>
            <button
              type="button"
              onClick={() => navigate('/chat', { state: { initialPrompt: 'Show my pending tasks and prioritize them.' } })}
              className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors"
            >
              "Show my pending tasks and prioritize them"
            </button>
            <button
              type="button"
              onClick={() => navigate('/chat', { state: { initialPrompt: 'Find two free hours tomorrow for project work.' } })}
              className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors"
            >
              "Find 2 free hours tomorrow"
            </button>
            <button
              type="button"
              onClick={() => navigate('/chat', { state: { initialPrompt: 'Plan my week around my exams.' } })}
              className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors"
            >
              "Plan week around exams"
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card hover onClick={() => navigate('/tasks')} className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Pending Tasks
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{pendingTasks.length}</span>
            <span className="text-xs text-slate-500">active in queue</span>
          </div>
        </Card>

        <Card hover onClick={() => navigate('/tasks')} className="border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Completed
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{completedTasks.length}</span>
            <span className="text-xs text-emerald-600 font-medium">persisted records</span>
          </div>
        </Card>

        <Card hover onClick={() => navigate('/schedule')} className="border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Calendar Events
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{events.length}</span>
            <span className="text-xs text-slate-500">internal schedule</span>
          </div>
        </Card>

        <Card hover onClick={() => navigate('/tasks')} className="border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Overdue Alerts
            </span>
            <div className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{overdueTasks.length}</span>
            <span className="text-xs text-slate-500">require immediate action</span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Priority Task List + Productivity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Algorithmic Prioritized Tasks (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-800">
                  Priority Action Queue
                </h3>
              </div>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <span>View All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {prioritizedTasks.slice(0, 4).map((item, idx) => (
                <div
                  key={item.task.id}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {item.task.title}
                      </span>
                      <Badge
                        variant={
                          item.task.priority === 'urgent'
                            ? 'danger'
                            : item.task.priority === 'high'
                            ? 'warning'
                            : 'default'
                        }
                        size="sm"
                      >
                        {item.task.priority.toUpperCase()}
                      </Badge>
                      <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {item.task.estimated_duration} mins
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                      {item.reason}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Score: {item.urgency_score}
                    </span>
                  </div>
                </div>
              ))}

              {prioritizedTasks.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No active tasks in queue.</p>
              )}
            </div>
          </Card>

          {/* Productivity Chart */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  Weekly Study & Project Hours
                </h3>
              </div>
              <span className="text-xs text-slate-400">Past 7 Days</span>
            </div>

            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivityData}>
                  <defs>
                    <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProject" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit="h" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="study" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStudy)" name="Study" />
                  <Area type="monotone" dataKey="project" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorProject)" name="Project" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Right Column: Upcoming Events & Agent Activity (1 col) */}
        <div className="space-y-6">
          {/* Upcoming Schedule */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-800">Upcoming Events</h3>
              </div>
              <button
                onClick={() => navigate('/schedule')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Schedule
              </button>
            </div>

            <div className="space-y-2.5">
              {events.slice(0, 4).map((ev) => {
                const sDate = new Date(ev.start_time);
                return (
                  <div key={ev.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60">
                    <p className="text-xs font-semibold text-slate-800 truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span>{sDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span>{sDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
              {events.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No events scheduled.</p>
              )}
            </div>
          </Card>

          {/* Recent Agent Runs */}
          <Card>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">Recent Agent Runs</h3>
              </div>
              <button
                onClick={() => navigate('/agent')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Trace
              </button>
            </div>

            <div className="space-y-2.5">
              {recentRuns.slice(0, 4).map((run) => (
                <div key={run.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-slate-700 truncate max-w-[150px]">
                      {run.intent || 'Agent Execution'}
                    </span>
                    <Badge
                      variant={
                        run.status === 'completed'
                          ? 'success'
                          : run.status === 'awaiting_approval'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {run.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                    {run.user_prompt}
                  </p>
                </div>
              ))}
              {recentRuns.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No agent runs recorded yet.</p>
              )}
            </div>
          </Card>

          {/* MCP Health Quick Status */}
          <Card className="bg-gradient-to-br from-navy-900 to-navy-800 text-white border-navy-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase text-blue-300">MCP Protocol</span>
              <Wrench className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xs text-slate-300">
              14 registered tools active via Streamable HTTP (spec version 2025-11-25).
            </p>
            <button
              onClick={() => navigate('/tools')}
              className="mt-3 w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
            >
              Inspect MCP Tools
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
