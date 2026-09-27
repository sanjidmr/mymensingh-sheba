export interface CategoryHeaderProps {
  title: string;
  description?: string;
  dark?: boolean;
}

/**
 * CategoryHeader — refined, quiet centered section heading: a big deep-forest
 * title and one supporting line. `dark` flips the text palette for headings on
 * the deep-forest band.
 */
export default function CategoryHeader({
  title,
  description,
  dark = false,
}: CategoryHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2
        className={`max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl ${
          dark ? 'text-white' : 'text-ink-900'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-2.5 max-w-2xl text-sm leading-relaxed sm:text-[15px] ${
            dark ? 'text-brand-100/75' : 'text-ink-500'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}