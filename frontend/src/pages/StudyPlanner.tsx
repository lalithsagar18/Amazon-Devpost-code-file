import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ApprovalCard } from '../components/agent/ApprovalCard';
import { api } from '../services/api';
import { StudyPlanResponse, Approval } from '../types';

export const StudyPlanner: React.FC = () => {
  const [subject, setSubject] = useState('Calculus II');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().slice(0, 10);
  });
  const [availableHours, setAvailableHours] = useState(2.5);
  const [targetSessions, setTargetSessions] = useState(4);
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlanResponse | null>(null);
  const [stagedApproval, setStagedApproval] = useState<Approval | null>(null);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStagedApproval(null);

    try {
      const plan = await api.generateStudyPlan({
        subject,
        exam_date: new Date(examDate).toISOString(),
        available_hours_per_day: Number(availableHours),
        target_sessions_count: Number(targetSessions),
      });
      setGeneratedPlan(plan);

      // Create a pending approval so user can review and approve saving to calendar
      const approvalPayload = {
        sessions: plan.sessions,
        subject: plan.subject,
      };

      const res = await fetch('http://localhost:8000/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: 'save_study_plan_sessions',
          title: `Save ${plan.sessions.length} Study Sessions for ${plan.subject}`,
          description: `Schedule ${plan.sessions.length} conflict-free study sessions (${plan.total_study_hours} total hours) before your exam on ${new Date(examDate).toLocaleDateString()}.`,
          proposed_payload: approvalPayload,
          affected_records_summary: `Calendar Database (${plan.sessions.length} new events)`,
        }),
      });

      if (res.ok) {
        const approvalObj = await res.json();
        setStagedApproval(approvalObj);
      }
    } catch (err: any) {
      alert('Error generating plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Exam & Study Planner</h2>
        <p className="text-xs text-slate-500">
          Synthesizes exam deadlines with calendar openings to generate conflict-free study roadmaps.
        </p>
      </div>

      {/* Input Parameters Form Card */}
      <Card className="bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/30 border-indigo-200/80">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-800">
            Configure Exam Milestone & Available Capacity
          </h3>
        </div>

        <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject / Course Name *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Calculus II or Machine Learning"
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Exam Date *</label>
            <input
              type="date"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Max Study Hours / Day</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="10"
              value={availableHours}
              onChange={(e) => setAvailableHours(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Number of Sessions</label>
            <select
              value={targetSessions}
              onChange={(e) => setTargetSessions(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white rounded-lg border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value={3}>3 Progressive Sessions</option>
              <option value={4}>4 Progressive Sessions</option>
              <option value={5}>5 Progressive Sessions</option>
              <option value={6}>6 Intensive Sessions</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end mt-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Analyzing Schedule...' : 'Generate Conflict-Free Study Plan'}</span>
            </button>
          </div>
        </form>
      </Card>

      {/* Generated Study Plan Display */}
      {generatedPlan && (
        <div className="space-y-5 animate-fadeIn">
          {/* Transparent Reasoning Card */}
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 leading-relaxed flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-indigo-900 mb-1">Pedagogical Prioritization Reasoning:</p>
              <p>{generatedPlan.reasoning}</p>
              <div className="mt-2.5 flex items-center gap-4 text-[11px] font-semibold text-indigo-700">
                <span>Days Until Exam: {generatedPlan.days_until_exam} days</span>
                <span>•</span>
                <span>Total Prep Hours: {generatedPlan.total_study_hours} hrs</span>
                <span>•</span>
                <span>Sessions Generated: {generatedPlan.sessions.length}</span>
              </div>
            </div>
          </div>

          {/* Staged Human Approval Card */}
          {stagedApproval && (
            <ApprovalCard
              approval={stagedApproval}
              onActionComplete={() => {
                alert('Study plan sessions have been verified and persisted to your calendar!');
              }}
            />
          )}

          {/* Sessions Grid */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-800">
              Proposed Conflict-Free Sessions ({generatedPlan.sessions.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedPlan.sessions.map((session, idx) => {
                const sDt = new Date(session.start_time);
                const eDt = new Date(session.end_time);

                return (
                  <Card key={idx} className="border-l-4 border-l-indigo-500 hover:border-slate-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        Session {idx + 1}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {session.duration_minutes} mins
                      </span>
                    </div>

                    <h5 className="font-bold text-sm text-slate-900 mt-2">{session.title}</h5>
                    <p className="text-xs text-slate-500 mt-1">{session.focus_objective}</p>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>
                        {sDt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} @{' '}
                        {sDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                        {eDt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
