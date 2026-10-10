export interface CategoryHeaderProps {
  title: string;
  description?: string;
  dark?: boolean;
  compact?: boolean;
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
  compact = false,
}: CategoryHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <h2
        className={`max-w-3xl font-extrabold leading-tight tracking-tight ${
          compact ? 'text-lg sm:text-2xl lg:text-[1.6rem]' : 'text-[22px] sm:text-3xl lg:text-[2rem]'
        } ${
          dark ? 'text-white' : 'text-ink-900'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-1.5 max-w-2xl text-[13px] leading-relaxed sm:text-sm ${
            dark ? 'text-brand-100/75' : 'text-ink-500'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}