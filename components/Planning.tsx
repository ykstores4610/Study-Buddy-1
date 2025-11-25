import React, { useState } from 'react';
import { Config, Kid, StudySession } from '../types';

interface PlanningProps {
  config: Config;
  onStart: (kids: Kid[]) => void;
  onBack: () => void;
}

const Planning: React.FC<PlanningProps> = ({ config, onStart, onBack }) => {
  const [kids, setKids] = useState<Kid[]>(() => {
    return Array.from({ length: config.numKids }).map((_, i) => ({
      id: `kid-${i}`,
      name: '',
      sessions: Array.from({ length: config.numSessions }).map((__, j) => ({
        id: `sess-${i}-${j}`,
        topic: '',
        completed: false
      }))
    }));
  });

  const handleNameChange = (kidIndex: number, name: string) => {
    setKids(prev => {
      const newKids = [...prev];
      newKids[kidIndex].name = name;
      return newKids;
    });
  };

  const handleTopicChange = (kidIndex: number, sessionIndex: number, topic: string) => {
    setKids(prev => {
      const newKids = [...prev];
      newKids[kidIndex].sessions[sessionIndex].topic = topic;
      return newKids;
    });
  };

  const isFormValid = () => {
    return kids.every(k => k.name.trim() !== '' && k.sessions.every(s => s.topic.trim() !== ''));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-textMain mb-2">Plan The Day</h2>
        <p className="text-textMuted">Fill in names and subjects below.</p>
      </div>

      <div className="space-y-8">
        {kids.map((kid, kidIdx) => (
          <div key={kid.id} className="bg-white p-8 rounded-[2rem] shadow-soft border border-white/50 relative overflow-hidden group hover:shadow-card transition-all duration-300">
            {/* Gradient accent bar */}
            <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-primary to-accent opacity-50 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="mb-8 pl-4">
              <label className="block text-xs uppercase font-bold text-textMuted tracking-wider mb-2">Student #{kidIdx + 1}</label>
              <input
                type="text"
                placeholder="Enter Student Name"
                value={kid.name}
                onChange={(e) => handleNameChange(kidIdx, e.target.value)}
                className="w-full p-4 text-xl font-bold bg-transparent border-b-2 border-slate-100 focus:border-primary outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
              />
            </div>

            <div className="space-y-6 pl-4">
              {kid.sessions.map((session, sessIdx) => (
                <div key={session.id} className="flex flex-col gap-2">
                  <span className="text-sm font-bold text-textMuted uppercase tracking-wide">Session {sessIdx + 1}</span>
                  <textarea
                    placeholder="What will they study? (e.g. Math pages 10-15)"
                    value={session.topic}
                    onChange={(e) => handleTopicChange(kidIdx, sessIdx, e.target.value)}
                    className="w-full p-4 bg-background border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none h-24 text-base shadow-inner"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-20">
        <div className="max-w-3xl mx-auto flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 bg-white hover:bg-slate-50 text-textMuted font-bold py-5 rounded-2xl shadow-lg border border-slate-100 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => onStart(kids)}
            disabled={!isFormValid()}
            className={`flex-[2] font-bold py-5 rounded-2xl shadow-lg transition-all transform active:scale-[0.98] text-white text-lg ${
              isFormValid() 
                ? 'bg-primary hover:bg-primaryDark shadow-primary/30' 
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default Planning;