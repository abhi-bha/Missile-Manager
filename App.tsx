import React, { useState } from 'react';
import { WorldMap } from './components/WorldMap';
import { Terminal } from './components/Terminal';
import { generateDamageReport } from './services/geminiService';
import { GeoLocation, SimulationState, DamageReport, Mission } from './types';
import { RotateCw, Crosshair, AlertTriangle, ShieldAlert, Activity, Cpu } from 'lucide-react';

export default function App() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [logs, setLogs] = useState<string[]>(['System initialized.', 'Waiting for target designation...', 'Multiple target selection enabled.']);
  const [reports, setReports] = useState<DamageReport[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleSelectTarget = (location: GeoLocation) => {
    const newMission: Mission = {
        id: crypto.randomUUID(),
        target: location,
        status: 'ARMED'
    };
    
    setMissions(prev => [...prev, newMission]);
    addLog(`Target locked: ${location.name} [ID: ${newMission.id.slice(0,4)}]`);
  };

  const handleLaunch = () => {
    const armedMissions = missions.filter(m => m.status === 'ARMED');
    if (armedMissions.length === 0) return;
    
    addLog(`Launch authorization confirmed for ${armedMissions.length} vector(s).`);
    addLog('Initiating launch sequence...');
    
    setMissions(prev => prev.map(m => 
        m.status === 'ARMED' ? { ...m, status: 'LAUNCHING' } : m
    ));
  };

  const handleImpact = async (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission) return;

    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status: 'IMPACTED' } : m));
    
    addLog(`Impact confirmed: ${mission.target.name} [ID: ${mission.id.slice(0,4)}]`);
    addLog(`Deploying assessment drones for sector ${mission.id.slice(0,4)}...`);
    
    setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status: 'ANALYZING' } : m));

    try {
        const data = await generateDamageReport(mission.target.name);
        // Attach ID to report
        const fullReport: DamageReport = { ...data, missionId: mission.id };
        
        setReports(prev => [fullReport, ...prev]);
        setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status: 'COMPLETE' } : m));
        addLog(`Analysis received for Sector ${mission.target.name}.`);
    } catch (e) {
        addLog(`Failed to analyze Sector ${mission.target.name}.`);
        setMissions(prev => prev.map(m => m.id === missionId ? { ...m, status: 'COMPLETE' } : m));
    }
  };

  const handleReset = () => {
    setMissions([]);
    setReports([]);
    setLogs(['System reset.', 'Waiting for target designation...']);
  };

  const activeCount = missions.filter(m => m.status !== 'COMPLETE' && m.status !== 'IMPACTED').length;
  const armedCount = missions.filter(m => m.status === 'ARMED').length;

  return (
    <div className="min-h-screen bg-[#050505] text-green-500 p-4 md:p-6 flex flex-col gap-4 overflow-hidden relative">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-green-900 pb-4 mb-2">
        <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-wider flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-red-500" />
                GLOBAL IMPACT SIM
            </h1>
            <p className="text-xs text-green-700 mt-1 uppercase tracking-[0.3em]">Top Secret // Clearance Level 5 // Eyes Only</p>
        </div>
        <div className="flex gap-4 text-xs font-mono text-green-700">
            <div className="flex flex-col items-end">
                <span>CONN: SECURE</span>
                <span>LATENCY: 12ms</span>
            </div>
            <div className="flex flex-col items-end">
                <span>HQ: WASHINGTON DC</span>
                <span>ACTIVE OPS: {activeCount}</span>
            </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Main Map View */}
        <div className="lg:col-span-8 flex flex-col min-h-[400px] lg:min-h-0">
            <div className="flex-1 border border-green-900/50 rounded-lg p-1 bg-[#0a0a0a] shadow-2xl relative">
                <WorldMap 
                    onSelectTarget={handleSelectTarget} 
                    missions={missions}
                    onImpact={handleImpact}
                />
            </div>
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0 overflow-y-auto pr-2">
            
            {/* Control Panel */}
            <div className="bg-[#0a0a0a] border border-green-800 p-6 rounded-lg shadow-lg relative overflow-hidden group shrink-0">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-20 group-hover:opacity-50 transition-opacity" />
                
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-display text-white flex items-center gap-2">
                        <Crosshair className="w-5 h-5 text-red-500" />
                        FIRE CONTROL
                    </h2>
                    <span className="text-xs font-mono text-red-500 border border-red-900/50 px-2 py-1 rounded bg-red-900/10">
                        {armedCount} TARGETS READY
                    </span>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleReset}
                            className="flex items-center justify-center gap-2 py-4 px-4 border border-green-700 text-green-500 hover:bg-green-900/30 transition-all uppercase font-bold tracking-wider rounded"
                        >
                            <RotateCw className="w-4 h-4" /> Reset
                        </button>

                        <button
                            onClick={handleLaunch}
                            disabled={armedCount === 0}
                            className={`
                                flex items-center justify-center gap-2 py-4 px-4 
                                border border-red-600 bg-red-900/20 text-red-500 
                                hover:bg-red-600 hover:text-white
                                disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-red-900 disabled:border-red-900
                                transition-all uppercase font-bold tracking-wider rounded shadow-[0_0_15px_rgba(239,68,68,0.2)]
                                ${armedCount > 0 ? 'animate-pulse' : ''}
                            `}
                        >
                            <AlertTriangle className="w-4 h-4" /> LAUNCH ({armedCount})
                        </button>
                    </div>
                </div>
            </div>

            {/* Terminal Log */}
            <div className="h-48 shrink-0">
                <Terminal logs={logs} />
            </div>

            {/* Damage Reports Feed */}
            <div className="space-y-4">
                {reports.map((report) => (
                    <div key={report.missionId} className="bg-[#0a0a0a] border border-red-900/50 p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h2 className="text-sm font-display text-red-500 mb-2 flex items-center gap-2 border-b border-red-900/30 pb-2">
                            <Activity className="w-4 h-4" />
                            ASSESSMENT: {report.location}
                        </h2>
                        
                        <div className="space-y-2 font-mono text-xs">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-red-800 block uppercase">Radius</span>
                                    <span className="text-red-400">{report.impactRadius}</span>
                                </div>
                                <div>
                                    <span className="text-red-800 block uppercase">Est. Cas.</span>
                                    <span className="text-red-400">{report.casualtyEstimate}</span>
                                </div>
                            </div>
                            <div className="pt-2">
                                <span className="text-red-800 block uppercase">Summary</span>
                                <p className="text-gray-400 italic">"{report.summary}"</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

        </div>
      </div>
    </div>
  );
}
