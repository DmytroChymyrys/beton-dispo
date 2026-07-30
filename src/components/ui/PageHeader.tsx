/** Single H1 + intro block shared by every non-home page. */
export function PageHeader({ title, intro }: { title: string; intro?: string }) {
  return (
    <div className="border-line bg-surface border-b">
      <div className="container-page py-12 md:py-16">
        <h1 className="text-4xl leading-[1.08] sm:text-5xl">{title}</h1>
        {intro ? (
          <p className="text-ink-muted mt-4 max-w-2xl text-lg leading-relaxed">{intro}</p>
        ) : null}
      </div>
    </div>
  );
}
