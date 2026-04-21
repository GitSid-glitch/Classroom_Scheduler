interface SummaryCard {
  label: string;
  value: string;
  detail: string;
}

interface SummaryCardsProps {
  cards: SummaryCard[];
}

export function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur"
        >
          <p className="text-sm text-stone-400">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-stone-50">{card.value}</p>
          <p className="mt-2 text-sm leading-6 text-stone-300">{card.detail}</p>
        </article>
      ))}
    </section>
  );
}
