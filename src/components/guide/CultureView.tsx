import type { CultureTopic } from "@/lib/domain/types";

/** Rich "living culture" cards — anthem, mascot, torcida, stadium lore. */
export function CultureView({ topics }: { topics: CultureTopic[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {topics.map((t) => (
        <article key={t.titleKo} className="pm-card flex flex-col gap-2 p-4">
          <div className="flex items-start gap-2">
            <span aria-hidden="true" className="text-2xl leading-none">
              {t.icon}
            </span>
            <div>
              <h3 className="font-bold leading-snug">{t.titleKo}</h3>
              {t.subtitleKo ? (
                <p className="text-xs text-[var(--pm-muted)]">{t.subtitleKo}</p>
              ) : null}
            </div>
          </div>
          <p className="text-sm leading-relaxed">{t.bodyKo}</p>
          {t.tagsKo && t.tagsKo.length > 0 ? (
            <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
              {t.tagsKo.map((tag) => (
                <span
                  key={tag}
                  className="pm-chip bg-[var(--pm-primary)]/10 text-[var(--pm-primary-text)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
