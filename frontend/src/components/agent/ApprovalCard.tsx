import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Loader2, Calendar, FileText, ArrowRight } from 'lucide-react';
import { Approval } from '../../types';
import { api } from '../../services/api';

interface ApprovalCardProps {
  approval: Approval;
  onActionComplete?: (updatedApproval: any) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  approval,
  onActionComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [currentApproval, setCurrentApproval] = useState<Approval>(approval);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await api.approveAction(currentApproval.id, currentApproval.idempotency_token);
      setCurrentApproval((prev) => ({
        ...prev,
        status: res.status,
        execution_result: res.execution_result,
        verified_data: res.verified_record,
      }));
      setResultMessage(res.message);
      if (onActionComplete) onActionComplete(res);
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await api.cancelAction(currentApproval.id);
      setCurrentApproval((prev) => ({ ...prev, status: 'cancelled' }));
      setResultMessage(res.message);
      if (onActionComplete) onActionComplete(res);
    } catch (err: any) {
      alert(`Cancellation error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isPending = currentApproval.status === 'pending';
  const isExecuted = currentApproval.status === 'executed' || currentApproval.status === 'approved';
  const isCancelled = currentApproval.status === 'cancelled';

  return (
    <div className="my-4 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-900 text-sm md:text-base">
              {currentApproval.title}
            </h4>
            <span
              className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                isPending
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : isExecuted
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {currentApproval.status}
            </span>
          </div>

          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {currentApproval.description}
          </p>

          {currentApproval.affected_records_summary && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-white/70 px-2.5 py-1 rounded-md border border-slate-200">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Target: <strong>{currentApproval.affected_records_summary}</strong></span>
            </div>
          )}

          {/* Pending Action Controls */}
          {isPending && (
            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={handleApprove}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Approve & Persist</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Cancel</span>
              </button>
            </div>
          )}

          {/* Executed Success Card */}
          {isExecuted && (
            <div className="mt-3.5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800">
                  {resultMessage || "Operation verified and persisted in database."}
                </p>
                {currentApproval.verified_data && (
                  <pre className="mt-1 text-[11px] bg-emerald-100/60 p-2 rounded text-emerald-950 overflow-x-auto font-mono">
                    {JSON.stringify(currentApproval.verified_data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Cancelled Card */}
          {isCancelled && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-slate-400" />
              <span>{resultMessage || "Action cancelled by user. No database changes were executed."}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
