interface ModeToggleProps {
  readonly mode: 'ai' | 'manual';
  readonly isSwitching: boolean;
  readonly onModeSwitch: (mode: 'ai' | 'manual') => void;
}

export default function ModeToggle({ mode, isSwitching, onModeSwitch }: ModeToggleProps) {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center bg-slate-800/60 border border-slate-600/50 rounded-xl p-1 gap-1">
        <button
          onClick={() => onModeSwitch('ai')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'ai'
              ? 'bg-purple-500/20 text-white border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          disabled={isSwitching}
        >
          <span className="material-symbols-outlined text-base">smart_toy</span>{" "}
          Jhon Jairo
        </button>
        <button
          onClick={() => onModeSwitch('manual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual'
              ? 'bg-blue-500/20 text-white border border-blue-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          disabled={isSwitching}
        >
          <span className="material-symbols-outlined text-base">terminal</span>{" "}
          Modo Manual
        </button>
      </div>
    </div>
  );
}

