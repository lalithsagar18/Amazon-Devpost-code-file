import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Activity,
  CheckCircle2,
  Terminal,
  ShieldAlert,
  Play,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { api } from '../services/api';
import { ToolInfo } from '../types';

export const ConnectedTools: React.FC = () => {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Testing modal
  const [testingTool, setTestingTool] = useState<ToolInfo | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadToolsData();
  }, []);

  const loadToolsData = async () => {
    try {
      setLoading(true);
      const [toolsData, healthData] = await Promise.all([
        api.getTools(),
        api.getToolsHealth(),
      ]);
      setTools(toolsData);
      setHealth(healthData);
    } catch (err: any) {
      console.error('Failed to load MCP tools data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openTestModal = (tool: ToolInfo) => {
    setTestingTool(tool);
    setExecutionResult(null);
    // Initialize default parameter values
    const defaults: Record<string, any> = {};
    tool.parameters.forEach((p) => {
      if (p.name === 'status' || p.name === 'priority' || p.name === 'category') {
        defaults[p.name] = 'all';
      } else if (p.name === 'target_date') {
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        defaults[p.name] = tmrw.toISOString().slice(0, 10);
      } else if (p.name === 'duration_minutes') {
        defaults[p.name] = 120;
      } else {
        defaults[p.name] = '';
      }
    });
    setParamValues(defaults);
  };

  const handleExecuteTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testingTool) return;
    setExecuting(true);
    setExecutionResult(null);

    try {
      // Filter out empty optional string params
      const cleanPayload: Record<string, any> = {};
      Object.entries(paramValues).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) {
          cleanPayload[k] = v;
        }
      });

      const res = await api.executeTool(testingTool.name, cleanPayload);
      setExecutionResult(res);
    } catch (err: any) {
      setExecutionResult({ error: err.message, success: false });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">MCP Protocol & Connected Tools</h2>
          <p className="text-xs text-slate-500">
            Official Python Model Context Protocol implementation (spec 2025-11-25) via Streamable HTTP.
          </p>
        </div>

        <button
          type="button"
          onClick={loadToolsData}
          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Protocol Health & Specification Banner */}
      {health && (
        <Card className="bg-gradient-to-r from-navy-900 via-navy-800 to-indigo-950 text-white border-navy-700">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  MCP Server: {health.mcp_server} ({health.status})
                </span>
              </div>
              <h3 className="text-lg font-extrabold tracking-tight">
                Streamable HTTP MCP Specification Active
              </h3>
              <p className="text-xs text-slate-300">
                Specification Version: <span className="font-mono text-blue-300">{health.mcp_specification}</span>
              </p>
            </div>

            <div className="flex items-center gap-4 text-center">
              <div className="p-3 bg-white/10 rounded-xl">
                <span className="block text-2xl font-black text-white">{health.total_tools}</span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider">Registered Tools</span>
              </div>
              <div className="p-3 bg-white/10 rounded-xl">
                <span className="block text-2xl font-black text-emerald-400">100%</span>
                <span className="text-[10px] text-slate-300 uppercase tracking-wider">Health Score</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 14 MCP Tools Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Card key={tool.name} className="flex flex-col justify-between hover:border-slate-300 transition-all">
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-600 shrink-0" />
                  <h4 className="font-mono font-bold text-xs text-slate-900">{tool.name}</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="navy" size="sm">
                    {tool.category}
                  </Badge>
                  {tool.requires_approval && (
                    <Badge variant="warning" size="sm">
                      Approval Gated
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {tool.description}
              </p>

              {/* Schema Parameters */}
              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <span className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider block mb-1">
                  Parameters ({tool.parameters.length})
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tool.parameters.map((p) => (
                    <span
                      key={p.name}
                      className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                    >
                      {p.name}
                      {p.required && <span className="text-rose-500">*</span>}
                    </span>
                  ))}
                  {tool.parameters.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">No parameters required</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">
                {tool.consequential ? 'Consequential Mutation' : 'Read-Only Query'}
              </span>

              <button
                type="button"
                onClick={() => openTestModal(tool)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>Test Tool</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Tool Test Modal */}
      <Modal
        isOpen={testingTool !== null}
        onClose={() => setTestingTool(null)}
        title={testingTool ? `Execute MCP Tool: ${testingTool.name}` : ''}
        maxWidth="lg"
      >
        {testingTool && (
          <form onSubmit={handleExecuteTool} className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">{testingTool.description}</p>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h5 className="font-bold text-slate-800 text-xs">Tool Input Parameters:</h5>
              {testingTool.parameters.map((param) => (
                <div key={param.name}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 font-mono text-[11px]">
                      {param.name} {param.required && <span className="text-rose-500">*</span>}
                    </label>
                    <span className="text-[10px] text-slate-400">{param.type}</span>
                  </div>
                  <input
                    type="text"
                    required={param.required}
                    value={paramValues[param.name] ?? ''}
                    onChange={(e) =>
                      setParamValues((prev) => ({ ...prev, [param.name]: e.target.value }))
                    }
                    placeholder={param.description}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}

              {testingTool.parameters.length === 0 && (
                <p className="text-xs text-slate-400 italic">This tool takes no arguments.</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTestingTool(null)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={executing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-all"
              >
                {executing ? 'Invoking Tool...' : 'Execute Tool Call'}
              </button>
            </div>

            {/* Execution Result Box */}
            {executionResult && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <h5 className="font-bold text-slate-800 text-xs mb-1.5">Machine-Readable Execution Output:</h5>
                <pre className="p-3 bg-navy-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed">
                  {JSON.stringify(executionResult, null, 2)}
                </pre>
              </div>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
};
