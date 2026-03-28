function AnalysisLoader() {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className="flex h-10 items-end gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((bar) => (
          <span
            key={bar}
            className="h-2 w-1.5 animate-[analysisBar_1.1s_ease-in-out_infinite] rounded-sm bg-emerald-400/90"
            style={{ animationDelay: `${bar * 0.12}s` }}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-emerald-300">Analyzing Product</p>
        <p className="text-xs text-slate-400">Scanning offers & coupons...</p>
      </div>
    </div>
  );
}

export default AnalysisLoader;
