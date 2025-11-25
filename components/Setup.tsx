import React, { useState, useEffect } from 'react';
import { Config, SoundType } from '../types';
import { playSound } from '../utils/sound';

interface SetupProps {
  onNext: (config: Config) => void;
}

const Setup: React.FC<SetupProps> = ({ onNext }) => {
  const [formData, setFormData] = useState<Config>({
    numKids: 1,
    numSessions: 3,
    studyDurationMinutes: 25,
    breakDurationMinutes: 5,
    soundType: 'classic',
    customSoundData: undefined,
  });

  const [uploadError, setUploadError] = useState<string | null>(null);

  // Load saved preferences on mount
  useEffect(() => {
    const savedSoundType = localStorage.getItem('studyBuddy_soundType') as SoundType;
    const savedCustomSound = localStorage.getItem('studyBuddy_customSound');

    if (savedSoundType) {
      setFormData(prev => ({
        ...prev,
        soundType: savedSoundType,
        customSoundData: savedCustomSound || undefined
      }));
    }
  }, []);

  const handleChange = (field: keyof Config, value: any) => {
    const num = typeof value === 'string' ? parseInt(value) || 0 : value;
    const finalValue = field === 'soundType' ? value : Math.max(1, num);
    setFormData(prev => ({ ...prev, [field]: finalValue }));

    if (field === 'soundType') {
      localStorage.setItem('studyBuddy_soundType', value);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
      setUploadError("File is too large (Max 2MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, customSoundData: base64, soundType: 'custom' }));
      setUploadError(null);
      
      // Save to localStorage
      try {
        localStorage.setItem('studyBuddy_customSound', base64);
        localStorage.setItem('studyBuddy_soundType', 'custom');
      } catch (err) {
        setUploadError("Storage full. Sound works for this session only.");
      }
    };
    reader.readAsDataURL(file);
  };

  const testSound = () => {
    playSound(formData.soundType, formData.customSoundData);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 md:p-10 rounded-[2.5rem] shadow-soft border border-white/50">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-textMain mb-3">Session Setup</h2>
        <p className="text-textMuted text-lg">Let's configure your study environment.</p>
      </div>

      <div className="space-y-8">
        {/* Core Settings */}
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-bold text-textMuted uppercase tracking-wider mb-3">Number of Students</label>
            <input
              type="number"
              value={formData.numKids}
              onChange={(e) => handleChange('numKids', e.target.value)}
              className="w-full p-4 bg-background border-none rounded-2xl text-lg font-medium text-textMain focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-bold text-textMuted uppercase tracking-wider mb-3">Sessions per Student</label>
            <input
              type="number"
              value={formData.numSessions}
              onChange={(e) => handleChange('numSessions', e.target.value)}
              className="w-full p-4 bg-background border-none rounded-2xl text-lg font-medium text-textMain focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-textMuted uppercase tracking-wider mb-3">Study (min)</label>
            <input
              type="number"
              value={formData.studyDurationMinutes}
              onChange={(e) => handleChange('studyDurationMinutes', e.target.value)}
              className="w-full p-4 bg-background border-none rounded-2xl text-lg font-medium text-textMain focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-textMuted uppercase tracking-wider mb-3">Break (min)</label>
            <input
              type="number"
              value={formData.breakDurationMinutes}
              onChange={(e) => handleChange('breakDurationMinutes', e.target.value)}
              className="w-full p-4 bg-background border-none rounded-2xl text-lg font-medium text-textMain focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Sound Settings */}
        <div className="bg-background p-6 rounded-3xl">
          <label className="block text-sm font-bold text-textMuted uppercase tracking-wider mb-4">Alert Sound</label>
          <div className="flex gap-3 mb-4">
            <select
              value={formData.soundType}
              onChange={(e) => handleChange('soundType', e.target.value as SoundType)}
              className="flex-1 p-4 bg-white border-none rounded-xl text-textMain font-medium focus:ring-2 focus:ring-primary/50 outline-none shadow-sm cursor-pointer"
            >
              <option value="classic">Classic Alarm</option>
              <option value="bell">Gentle Bell</option>
              <option value="digital">Digital Chime</option>
              <option value="buzzer">Buzzer</option>
              <option value="custom">Custom Upload...</option>
            </select>
            
            <button 
              type="button"
              onClick={testSound}
              className="px-5 py-2 bg-white rounded-xl text-primary hover:bg-primary hover:text-white font-bold transition-colors shadow-sm"
            >
              Test 🔊
            </button>
          </div>

          {formData.soundType === 'custom' && (
            <div className="animate-enter">
              <label className="block w-full cursor-pointer group">
                <div className="flex items-center justify-center w-full px-4 py-4 bg-white border-2 border-dashed border-slate-200 rounded-xl group-hover:border-primary group-hover:bg-primary/5 transition-all">
                   <span className="text-sm text-textMuted font-medium truncate group-hover:text-primary">
                     {formData.customSoundData ? "✅ Custom sound loaded" : "📂 Click to upload audio (mp3/wav)"}
                   </span>
                   <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
                </div>
              </label>
              {uploadError && <p className="text-xs text-secondary mt-2 font-medium">{uploadError}</p>}
            </div>
          )}
        </div>

        <button
          onClick={() => onNext(formData)}
          className="w-full bg-primary hover:bg-primaryDark text-white font-bold py-5 px-6 rounded-2xl shadow-card hover:shadow-glow transform transition-all active:scale-[0.98] text-lg"
        >
          Start Planning
        </button>
      </div>
    </div>
  );
};

export default Setup;