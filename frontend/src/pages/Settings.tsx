import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  Database,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { api } from '../services/api';

export const Settings: React.FC = () => {
  const [health, setHealth] = useState<any | null>(null);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetSeed = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await api.resetSeed();
      setResetMessage(res.message);
    } catch (err: any) {
      setResetMessage('Error: ' + err.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Application Settings & Configuration</h2>
        <p className="text-xs text-slate-500">
          Orchestration providers, Alexa+ track verification, safety policies, and local database management.
        </p>
      </div>

      {/* AI Provider Configuration Card */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Cpu className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-800">Agent Orchestration Provider</h3>
            <p className="text-xs text-slate-500">
              Configure deterministic demonstration mode or external foundation model provider.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2 text-xs text-slate-700 leading-relaxed">
          <div className="flex items-center gap-2 font-bold text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Active Provider: Deterministic Demo Provider (Local DB Backed)</span>
          </div>
          <p>
            LifePilot AI runs by default with an explicitly labelled, zero-cost deterministic agent engine. It parses natural-language prompts, invokes live database tools, computes multi-factor urgency scores, checks calendar conflicts, and requires human approval for mutations.
          </p>
          <p className="text-slate-500 italic">
            *Truthful attribution guarantee: No external LLM is claimed to be used unless real API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, or AWS_BEDROCK) are configured in the backend environment.
          </p>
        </div>
      </Card>

      {/* Alexa+ Track Verification Notice */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-800">Alexa+ Track Compatibility</h3>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
          <p>
            <strong>Track Objective:</strong> Build an action-oriented AI productivity dashboard that goes beyond static answers to formulate plans, call tools, request approvals, and verify outcomes.
          </p>
          <p>
            <strong>Integration Notice:</strong> This project implements a web-based Alexa+ demonstration experience using the official Python MCP SDK with Streamable HTTP transport (MCP spec 2025-11-25).
          </p>
        </div>
      </Card>

      {/* Database & Seed Management Card */}
      <Card className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="font-bold text-sm text-slate-800">Database & Seed Records</h3>
            <p className="text-xs text-slate-500">
              Manage local persistence (SQLite / PostgreSQL) and reset demonstration fixtures.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 flex-wrap gap-4">
          <div>
            <h4 className="font-bold text-xs text-slate-800">Reset to Clean Seed State</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Restores standard student and professional test records (Calculus exam, Alexa+ project, ML notes).
            </p>
          </div>

          <button
            type="button"
            disabled={resetting}
            onClick={handleResetSeed}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
            <span>{resetting ? 'Resetting...' : 'Reset Seed Data'}</span>
          </button>
        </div>

        {resetMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{resetMessage}</span>
          </div>
        )}
      </Card>
    </div>
  );
};
