import type { LucideIcon } from 'lucide-react';

export default function SectionCard({
  title,
  icon: Icon,
  description,
  children,
  className = '',
}: {
  title: string;
  icon?: LucideIcon;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`form-section-card ${className}`}>
      <header className="form-section-heading">
        {Icon && (
          <span className="form-section-icon" aria-hidden="true">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="form-section-title">{title}</h2>
          {description && <p className="form-section-description">{description}</p>}
        </div>
      </header>
      <div className="form-section-content">{children}</div>
    </section>
  );
}
