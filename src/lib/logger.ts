type LogFn = (...args: unknown[]) => void;

interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
}

const noop: LogFn = () => {
  /* intentional noop */
};

export function logger(_namespace: string): Logger {
  return { debug: noop, info: noop, warn: noop, error: noop };
}
