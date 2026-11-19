export type ClientErrorReporter = (
  error: unknown,
  context: Record<string, unknown>
) => void;

let clientErrorReporter: ClientErrorReporter | null = null;

export function setClientErrorReporter(reporter: ClientErrorReporter | null): void {
  clientErrorReporter = reporter;
}

export function reportClientError(
  error: unknown,
  context: Record<string, unknown>
): void {
  console.error('[client-error]', context, error);
  try {
    clientErrorReporter?.(error, context);
  } catch (reportingError) {
    console.error('[client-error-reporter]', reportingError);
  }
}
