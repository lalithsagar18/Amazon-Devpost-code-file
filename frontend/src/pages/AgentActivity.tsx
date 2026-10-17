import React, { useState, useEffect } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  PlayCircle,
  Terminal,
  Filter,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { PlanView } from '../components/agent/PlanView';
import { ToolCallTrace } from '../components/agent/ToolCallTrace';
import { api } from '../services/api';
import { AgentRun } from '../types';

export const AgentActivity: React.FC = () => {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);

  useEffect(() => {
    loadRuns();
  }, [statusFilter]);

  const loadRuns = async () => {
    try {
      setLoading(true);
      const data = await api.getAgentRuns(statusFilter !== 'all' ? statusFilter : undefined);
      setRuns(data);
      if (data.length > 0 && !selectedRun) {
        setSelectedRun(data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load agent runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'awaiting_approval': return 'warning';
      case 'failed': return 'danger';
      case 'cancelled': return 'default';
      default: return 'navy';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Agent Activity & Execution History</h2>
          <p className="text-xs text-slate-500">
            Audit trail of intent recognition, plan formulation, MCP tool execution, and human approvals.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="awaiting_approval">Awaiting Approval</option>
            <option value="planning">Planning</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Runs List + Detailed Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Runs List */}
        <div className="lg:col-span-1 space-y-2.5 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
          {runs.map((run) => (
            <div
              key={run.id}
              onClick={() => setSelectedRun(run)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                selectedRun?.id === run.id
                  ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-slate-800 truncate">
                  {run.intent || 'Agent Run'}
                </span>
                <Badge variant={getStatusBadgeVariant(run.status)} size="sm">
                  {run.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                "{run.user_prompt}"
              </p>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Run #{run.id}</span>
                <span>{new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}

          {runs.length === 0 && !loading && (
            <p className="text-xs text-slate-500 text-center py-8">No agent runs match this filter.</p>
          )}
        </div>

        {/* Right Column: Execution Trace Details */}
        <div className="lg:col-span-2">
          {selectedRun ? (
            <Card className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">Run #{selectedRun.id}</span>
                    <Badge variant={getStatusBadgeVariant(selectedRun.status)}>
                      {selectedRun.status.toUpperCase()}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    Intent: <span className="font-mono text-blue-700">{selectedRun.intent || 'general_assistant'}</span>
                  </h3>
                </div>

                <span className="text-xs text-slate-400">
                  {new Date(selectedRun.created_at).toLocaleString()}
                </span>
              </div>

              {/* User Prompt */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Received User Prompt
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800">
                  "{selectedRun.user_prompt}"
                </div>
              </div>

              {/* Plan View */}
              {selectedRun.plan && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Multi-Step Action Plan
                  </h4>
                  <PlanView plan={selectedRun.plan as any} />
                </div>
              )}

              {/* Tool Calls */}
              {selectedRun.tool_calls && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Tool Invocations & Verified Results
                  </h4>
                  <ToolCallTrace toolCalls={selectedRun.tool_calls as any} />
                </div>
              )}

              {/* Truthful Summary */}
              {selectedRun.summary && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Truthful Outcome Summary
                  </h4>
                  <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {selectedRun.summary}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="text-center py-16 text-slate-400 text-xs">
              Select an agent execution trace from the left panel to inspect step-by-step telemetry.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
