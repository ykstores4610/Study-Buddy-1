import React, { useState } from 'react';
import Setup from './components/Setup';
import Planning from './components/Planning';
import Dashboard from './components/Dashboard';
import { AppPhase, Config, Kid, SoundType } from './types';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>('SETUP');
  const [config, setConfig] = useState<Config>({
    numKids: 1,
    numSessions: 3,
    studyDurationMinutes: 25,
    breakDurationMinutes: 5,
    soundType: 'classic',
  });
  const [kidsData, setKidsData] = useState<Kid[]>([]);

  // Phase Transitions
  const handleSetupComplete = (newConfig: Config) => {
    setConfig(newConfig);
    setPhase('PLANNING');
  };

  const handlePlanningComplete = (kids: Kid[]) => {
    setKidsData(kids);
    setPhase('TRACKING');
  };

  const handleReset = () => {
    setPhase('SETUP');
    setKidsData([]);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 font-sans text-textMain transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        {/* Header Logo */}
        <header className="flex items-center justify-between mb-12 px-2 animate-enter">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-primary to-primaryDark text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg shadow-primary/30">
                    <span className="text-2xl">🎓</span>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-textMain tracking-tight leading-none">
                        Study<span className="text-primary">Buddy</span>
                    </h1>
                    <p className="text-xs text-textMuted font-medium uppercase tracking-wider mt-1">Focus & Learn</p>
                </div>
            </div>
            
            {phase !== 'SETUP' && (
              <button 
                onClick={handleReset}
                className="text-xs font-semibold text-textMuted hover:text-secondary transition-colors uppercase tracking-widest"
              >
                Reset App
              </button>
            )}
        </header>

        {/* Dynamic Content */}
        <main className="animate-enter relative z-10">
          {phase === 'SETUP' && (
            <Setup onNext={handleSetupComplete} />
          )}
          
          {phase === 'PLANNING' && (
            <Planning 
              config={config} 
              onStart={handlePlanningComplete} 
              onBack={() => setPhase('SETUP')} 
            />
          )}
          
          {phase === 'TRACKING' && (
            <Dashboard 
              config={config} 
              initialKids={kidsData} 
              onFinish={handleReset} 
            />
          )}
        </main>
        
        <footer className="mt-20 text-center text-textMuted text-sm opacity-50">
          <p>© 2024 StudyBuddy Tracker</p>
        </footer>
      </div>
    </div>
  );
};

export default App;