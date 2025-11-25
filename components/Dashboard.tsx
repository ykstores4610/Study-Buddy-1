import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Config, Kid, TimerState } from '../types';
import { playSound, playDingSound } from '../utils/sound';

interface DashboardProps {
  config: Config;
  initialKids: Kid[];
  onFinish: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const Dashboard: React.FC<DashboardProps> = ({ config, initialKids, onFinish }) => {
  const [kids, setKids] = useState<Kid[]>(initialKids);
  
  // State for each kid's timer
  const [kidStates, setKidStates] = useState<Record<string, TimerState>>(() => {
    const states: Record<string, TimerState> = {};
    initialKids.forEach(kid => {
      states[kid.id] = {
        mode: 'STUDY',
        secondsLeft: config.studyDurationMinutes * 60,
        isRunning: true,
        currentSessionIndex: 0,
        isSessionFinished: false,
      };
    });
    return states;
  });

  // Navigation: Active kid being viewed
  const [activeKidId, setActiveKidId] = useState<string>(initialKids[0]?.id || '');

  // Audio context unlock tracking
  const audioUnlocked = useRef(false);

  // Modal State for "Break Over" - stores the ID of the kid who finished
  const [breakOverKidId, setBreakOverKidId] = useState<string | null>(null);

  // Helper to unlock audio on interaction
  const unlockAudio = () => {
    if (!audioUnlocked.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        new AudioContext().resume();
        audioUnlocked.current = true;
      }
    }
  };

  const markSessionComplete = useCallback((kidId: string, sessionIndex: number) => {
    setKids(prevKids => {
      return prevKids.map(kid => {
        if (kid.id === kidId && kid.sessions[sessionIndex]) {
          const newSessions = [...kid.sessions];
          newSessions[sessionIndex] = { ...newSessions[sessionIndex], completed: true };
          return { ...kid, sessions: newSessions };
        }
        return kid;
      });
    });
  }, []);

  // Main Timer Tick Logic - Runs globally for all kids
  useEffect(() => {
    const interval = window.setInterval(() => {
      setKidStates(prevStates => {
        const nextStates = { ...prevStates };
        let soundTriggered = false;
        let breakOverId: string | null = null;
        let studySessionCompleted = false;

        Object.keys(nextStates).forEach(kidId => {
          const state = { ...nextStates[kidId] };
          
          if (state.isRunning && !state.isSessionFinished) {
            if (state.secondsLeft <= 0) {
              // TIME IS UP
              
              if (state.mode === 'STUDY') {
                 // Study Finished - PAUSE and wait for confirmation
                 state.isRunning = false;
                 state.secondsLeft = 0;
                 
                 // Mark session complete in data to show visual feedback (checkmark/progress)
                 markSessionComplete(kidId, state.currentSessionIndex);
                 
                 // Trigger sound effect for completion
                 studySessionCompleted = true;

              } else if (state.mode === 'BREAK') {
                // Break Finished -> Alarm
                state.isRunning = false;
                state.secondsLeft = 0;
                breakOverId = kidId;
                soundTriggered = true;
              }
            } else {
              state.secondsLeft -= 1;
            }
          }
          nextStates[kidId] = state;
        });

        // Handle Side Effects
        if (soundTriggered && breakOverId) {
          playSound(config.soundType, config.customSoundData);
          setBreakOverKidId(breakOverId);
        } else if (studySessionCompleted) {
          playDingSound();
        }

        return nextStates;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [config.breakDurationMinutes, config.soundType, config.customSoundData, markSessionComplete]);


  // Timer Controls
  const toggleTimer = (kidId: string) => {
    unlockAudio();
    setKidStates(prev => ({
      ...prev,
      [kidId]: { ...prev[kidId], isRunning: !prev[kidId].isRunning }
    }));
  };

  const handleStartBreak = (kidId: string) => {
    unlockAudio();
    setKidStates(prev => {
        const state = prev[kidId];
        return {
            ...prev,
            [kidId]: {
                ...state,
                mode: 'BREAK',
                secondsLeft: config.breakDurationMinutes * 60,
                isRunning: true
            }
        };
    });
  };

  const handleFinishEarly = (kidId: string) => {
    unlockAudio();
    setKidStates(prev => {
      const state = { ...prev[kidId] };
      
      if (state.mode === 'STUDY') {
        // Skip rest of study session -> Mark complete and allow user to start break
        markSessionComplete(kidId, state.currentSessionIndex);
        playDingSound(); 
        
        // Don't auto-start break, just set timer to 0 so "Start Break" button appears
        return {
          ...prev,
          [kidId]: {
            ...state,
            secondsLeft: 0,
            isRunning: false
          }
        };
      } else {
        // Skip rest of break -> Go to Next Session
        const nextIndex = state.currentSessionIndex + 1;
        if (nextIndex >= config.numSessions) {
          return {
            ...prev,
            [kidId]: { ...state, isRunning: false, isSessionFinished: true, secondsLeft: 0 }
          };
        }
        return {
          ...prev,
          [kidId]: {
            ...state,
            mode: 'STUDY',
            secondsLeft: config.studyDurationMinutes * 60,
            isRunning: false, // Pause before start of next
            currentSessionIndex: nextIndex
          }
        };
      }
    });
  };

  const handleNextSessionStart = (kidId: string) => {
    unlockAudio();
    setBreakOverKidId(null);
    
    setKidStates(prev => {
      const state = prev[kidId];
      const nextIndex = state.currentSessionIndex + 1;
      
      if (nextIndex >= config.numSessions) {
        return {
          ...prev,
          [kidId]: {
            ...state,
            isRunning: false,
            isSessionFinished: true
          }
        };
      }

      return {
        ...prev,
        [kidId]: {
          mode: 'STUDY',
          secondsLeft: config.studyDurationMinutes * 60,
          isRunning: true,
          currentSessionIndex: nextIndex,
          isSessionFinished: false
        }
      };
    });
  };

  // Check if all kids are finished
  const allFinished = kids.every(k => kidStates[k.id]?.isSessionFinished);
  if (allFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-enter">
        <div className="bg-gradient-to-tr from-yellow-300 to-amber-500 w-32 h-32 rounded-full flex items-center justify-center text-6xl shadow-glow mb-8">
          🏆
        </div>
        <h2 className="text-4xl font-bold text-textMain mb-4">All Sessions Complete!</h2>
        <p className="text-xl text-textMuted mb-10 max-w-md mx-auto">Excellent work today. Everyone has finished their goals.</p>
        <button 
          onClick={onFinish}
          className="bg-primary hover:bg-primaryDark text-white px-10 py-5 rounded-full font-bold shadow-card transition-all transform hover:scale-105"
        >
          Start New Day
        </button>
      </div>
    );
  }

  // Active View Data
  const activeKid = kids.find(k => k.id === activeKidId);
  const activeState = kidStates[activeKidId];

  if (!activeKid || !activeState) return null;

  const isStudy = activeState.mode === 'STUDY';
  // Check if waiting for user confirmation (0 seconds in study mode)
  const isStudyComplete = isStudy && activeState.secondsLeft === 0;
  
  const currentTopic = activeKid.sessions[activeState.currentSessionIndex]?.topic || "Free Time";

  return (
    <div className="max-w-2xl mx-auto pb-20">
      
      {/* Kid Selector Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-white p-1.5 rounded-full shadow-sm border border-slate-100 inline-flex gap-1 overflow-x-auto max-w-full">
          {kids.map(kid => {
              const kState = kidStates[kid.id];
              const isFinished = kState.isSessionFinished;
              const isAlarming = breakOverKidId === kid.id;
              const isWaitingForBreak = kState.mode === 'STUDY' && kState.secondsLeft === 0 && !isFinished;
              
              let baseClasses = "px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap";
              let stateClasses = "text-textMuted hover:bg-slate-50";

              if (activeKidId === kid.id) {
                stateClasses = "bg-primary text-white shadow-md";
              } else if (isAlarming) {
                stateClasses = "bg-secondary text-white animate-pulse";
              } else if (isWaitingForBreak) {
                stateClasses = "bg-accent/10 text-accent ring-1 ring-accent/50";
              } else if (isFinished) {
                stateClasses = "text-accent/80 bg-slate-50";
              }

              return (
                  <button
                  key={kid.id}
                  onClick={() => setActiveKidId(kid.id)}
                  className={`${baseClasses} ${stateClasses}`}
                  >
                  {kid.name}
                  {isFinished && " ✓"}
                  {isAlarming && " 🔔"}
                  {isWaitingForBreak && !isFinished && activeKidId !== kid.id && " ⏳"}
                  </button>
              );
          })}
        </div>
      </div>

      {activeState.isSessionFinished ? (
         <div className="bg-white rounded-[2.5rem] shadow-card p-12 text-center border border-white/50 relative overflow-hidden animate-enter">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent to-primary"></div>
             <div className="text-8xl mb-6 animate-pop">🎉</div>
             <h3 className="text-3xl font-bold text-textMain mb-2">Done for the day!</h3>
             <p className="text-textMuted text-lg">{activeKid.name} has finished all sessions.</p>
         </div>
      ) : (
        <div className="space-y-6">
            {/* Main Timer Card */}
            <div className={`bg-white rounded-[2.5rem] shadow-card p-8 md:p-10 border border-white/50 relative overflow-hidden text-center transition-all duration-700 ${isStudyComplete ? 'ring-2 ring-accent/50 shadow-glow' : ''}`}>
                {/* Background Decoration */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700 ${isStudy ? 'bg-primary' : 'bg-accent'}`}></div>
                <div className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700 ${isStudy ? 'bg-secondary' : 'bg-primary'}`}></div>

                {/* Header */}
                <div className="relative z-10 flex justify-between items-center mb-10">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase bg-slate-100 ${isStudy ? 'text-primary' : 'text-accent'}`}>
                    {isStudy ? 'Focus Mode' : 'Break Time'}
                  </div>
                  <div className="text-xs font-bold text-textMuted uppercase tracking-widest">
                    Session {activeState.currentSessionIndex + 1} of {config.numSessions}
                  </div>
                </div>

                {/* Timer Display */}
                <div className={`relative z-10 font-mono font-medium mb-10 tracking-tighter leading-none transition-all duration-500 ${isStudyComplete ? 'scale-110' : ''}`} style={{ fontSize: 'clamp(4rem, 15vw, 7rem)' }}>
                  <span className={`${isStudy ? 'text-textMain' : 'text-accent'} ${isStudyComplete ? 'text-accent animate-pulse' : ''}`}>
                    {formatTime(activeState.secondsLeft)}
                  </span>
                </div>

                {/* Controls */}
                <div className="relative z-10 flex flex-col items-center gap-4">
                    {isStudyComplete ? (
                         <div className="w-full animate-enter">
                            <button 
                            onClick={() => handleStartBreak(activeKidId)}
                            className="w-full py-5 px-8 rounded-2xl font-bold text-xl bg-accent hover:bg-teal-600 text-white shadow-xl shadow-accent/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
                            >
                            <span>Start Break</span>
                            <span className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center text-sm">☕️</span>
                            </button>
                            <p className="mt-4 text-sm text-textMuted">Great job! Take a well-deserved break.</p>
                        </div>
                    ) : (
                        <div className="w-full flex flex-col gap-4">
                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => toggleTimer(activeKidId)}
                                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
                                        activeState.isRunning 
                                        ? 'bg-cream text-secondary hover:bg-rose-100 shadow-secondary/10' 
                                        : 'bg-primary text-white hover:bg-primaryDark shadow-primary/25'
                                    }`}
                                >
                                    {activeState.isRunning ? 'Pause Timer' : 'Start Timer'}
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => handleFinishEarly(activeKidId)}
                                className="text-sm font-semibold text-textMuted hover:text-primary transition-colors py-2"
                            >
                                {isStudy ? 'Mark Complete & Skip' : 'End Break Early'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Current Task Details & Progress */}
            <div className="bg-white rounded-3xl shadow-soft p-8 border border-white/50">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1">
                        <span className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-2">Current Objective</span>
                        <div className="text-2xl font-medium text-textMain leading-tight">
                            {isStudy ? (
                                <span className={isStudyComplete ? 'line-through opacity-50 decoration-accent decoration-2' : ''}>
                                    {currentTopic}
                                </span>
                            ) : (
                                <span className="text-accent flex items-center gap-2">
                                    Relax & Recharge
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 w-full md:w-auto">
                        <span className="text-xs font-bold text-textMuted uppercase tracking-wider block mb-4 md:text-right">Today's Progress</span>
                        <div className="flex gap-3 md:justify-end">
                            {activeKid.sessions.map((sess, idx) => {
                                const isCurrent = idx === activeState.currentSessionIndex;
                                const isCompleted = sess.completed;
                                
                                let circleClass = "w-4 h-4 rounded-full transition-all duration-500 ";
                                
                                if (isCompleted) {
                                    circleClass += "bg-accent shadow-[0_0_10px_rgba(13,148,136,0.4)] animate-pop";
                                } else if (isCurrent && isStudy && !activeState.isSessionFinished) {
                                    circleClass += "bg-primary animate-pulse ring-4 ring-primary/20";
                                } else {
                                    circleClass += "bg-slate-200";
                                }
                                
                                return (
                                    <div 
                                        key={sess.id} 
                                        className={circleClass}
                                        title={sess.topic}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Break Over Modal */}
      {breakOverKidId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-enter">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-urgent-bounce border-4 border-white ring-4 ring-secondary/20">
            <div className="w-20 h-20 bg-secondary/10 text-secondary rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                ⏰
            </div>
            <h2 className="text-2xl font-bold text-textMain mb-2">Break is Over!</h2>
            <p className="text-textMuted mb-8 font-medium">
                Ready for {kids.find(k => k.id === breakOverKidId)?.name}'s next session?
            </p>
            <button
              onClick={() => handleNextSessionStart(breakOverKidId!)}
              className="w-full bg-secondary hover:bg-rose-600 text-white text-lg font-bold py-4 rounded-2xl shadow-lg shadow-secondary/30 transform transition active:scale-[0.98]"
            >
              Start Next Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;