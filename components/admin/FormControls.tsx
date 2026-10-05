'use client';

import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/Button';

/**
 * A submit button that cannot be double-clicked.
 *
 * `useFormStatus` reflects the pending state of the enclosing form, so a
 * second tap while the server action is in flight is impossible rather than
 * merely discouraged. Every admin mutation uses this; a duplicate approve or a
 * double delete is exactly the class of bug a confirmation dialog alone does
 * not catch.
 */
export function SubmitButton({
  children,
  loadingLabel = 'সংরক্ষণ হচ্ছে…',
  className,
  ...props
}: ButtonProps & { loadingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      isLoading={pending}
      className={cn('min-w-28', className)}
      {...props}
    >
      {pending ? loadingLabel : children}
    </Button>
  );
}

/** Inline spinner for a button that is not inside a form. */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} aria-hidden="true" />;
}