export function PublicHomeClosingWidget() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand/10 rounded-full blur-[120px]" />

      <div className="relative max-w-5xl mx-auto px-4 text-center">
        <div className="space-y-8">
          <p className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
            <span className="bg-clip-text text-transparent bg-linear-to-b from-white to-white/60">
              Your learning journey, guided by AI — simple, safe, and effective.
            </span>
          </p>
          <div className="flex justify-center h-1 w-20 bg-brand-primary mx-auto rounded-full" />
        </div>
      </div>
    </section>
  );
}

