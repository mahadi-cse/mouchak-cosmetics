import { featureItems } from "./data";

export function Features() {
  return (
    <section className="border-b border-zinc-200 bg-white py-4">
      <div className="mx-auto grid max-w-6xl gap-0 px-4 sm:grid-cols-2 md:grid-cols-4">
        {featureItems.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.title}
              className={`flex items-center gap-3 px-4 py-4 transition hover:bg-zinc-50 ${idx < featureItems.length - 1 ? "md:border-r md:border-zinc-200" : ""}`}
            >
              <div className={`grid h-11 w-11 place-items-center rounded-xl ${feature.chipClass}`}>
                <Icon size={20} className={feature.iconClass} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900">{feature.title}</p>
                <p className="text-xs text-zinc-500">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
