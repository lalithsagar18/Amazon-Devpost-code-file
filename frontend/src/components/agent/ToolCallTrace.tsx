import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface ToolCallTraceProps {
  toolCalls: Array<{
    tool_name: string;
    arguments: Record<string, any>;
    status: string;
    [key: string]: any;
  }>;
}

export const ToolCallTrace: React.FC<ToolCallTraceProps> = ({ toolCalls }) => {
  const [expanded, setExpanded] = useState(false);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="my-2 text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-mono text-[11px] bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-md transition-colors"
      >
        <Terminal className="w-3.5 h-3.5 text-blue-600" />
        <span>MCP Tool Invocations ({toolCalls.length})</span>
        {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2 pl-2 border-l-2 border-blue-200">
          {toolCalls.map((call, idx) => (
            <div
              key={idx}
              className="bg-navy-900 text-slate-200 p-2.5 rounded-lg font-mono text-[11px] shadow-sm overflow-x-auto"
            >
              <div className="flex items-center justify-between gap-2 border-b border-navy-700 pb-1 mb-1.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {call.tool_name}
                </span>
                <span className="text-slate-400 text-[10px] uppercase">
                  {call.status}
                </span>
              </div>
              <pre className="text-slate-300 text-[10px] leading-relaxed">
                {JSON.stringify(call.arguments, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
