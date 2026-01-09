import React, { useEffect, useRef } from 'react';

interface TerminalProps {
  logs: string[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-black border border-green-800 p-4 h-full font-mono text-sm overflow-hidden flex flex-col shadow-[0_0_15px_rgba(0,255,0,0.1)]">
      <div className="text-green-600 mb-2 border-b border-green-900 pb-1 flex justify-between items-center">
        <span className="font-bold">SYSTEM LOG</span>
        <span className="text-xs animate-pulse">● LIVE</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-2">
        {logs.map((log, index) => (
            <div key={index} className="break-words">
                <span className="text-green-800 mr-2">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-green-400">{log}</span>
            </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
