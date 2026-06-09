export default function SplashScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950">
      <div className="animate-scaleIn flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
          <span className="text-5xl">🏏</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">KashmirCric</h1>
        <p className="text-sm text-emerald-400 font-medium tracking-widest uppercase">Cricket Scorer</p>
        <div className="mt-8 w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="absolute bottom-12 text-xs text-slate-600">Made for Kashmir Cricket</p>
    </div>
  );
}
