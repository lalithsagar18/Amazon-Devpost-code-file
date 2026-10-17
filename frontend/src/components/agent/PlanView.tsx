import React from 'react';
import { CheckCircle2, Clock, PlayCircle, Wrench } from 'lucide-react';

interface Step {
  step_number: number;
  description: string;
  tool_name?: string;
  status: string;
}

interface PlanViewProps {
  plan: Step[];
}

export const PlanView: React.FC<PlanViewProps> = ({ plan }) => {
  if (!plan || plan.length === 0) return null;

  return (
    <div className="my-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3.5">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
        <PlayCircle className="w-4 h-4 text-blue-600" />
        <span>Agent Structured Plan</span>
      </div>

      <div className="space-y-2">
        {plan.map((step) => {
          const isDone = step.status === 'completed';
          const isRunning = step.status === 'running' || step.status === 'planning';
          const isAwaiting = step.status === 'awaiting_approval';

          return (
            <div
              key={step.step_number}
              className="flex items-start gap-2.5 text-xs bg-white p-2.5 rounded-md border border-slate-200/80 shadow-xs"
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : isAwaiting ? (
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                ) : isRunning ? (
                  <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block text-[10px] text-center leading-3 font-semibold text-slate-400">
                    {step.step_number}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <p className="text-slate-800 font-medium">{step.description}</p>
                {step.tool_name && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    <Wrench className="w-3 h-3" />
                    <span>{step.tool_name}</span>
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  isDone
                    ? 'text-emerald-700 bg-emerald-50'
                    : isAwaiting
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-slate-500 bg-slate-100'
                }`}
              >
                {step.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
