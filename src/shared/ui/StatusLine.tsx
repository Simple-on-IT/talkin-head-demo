type StatusLineProps = {
  status: string;
  text: string;
};

export function StatusLine({ status, text }: StatusLineProps): JSX.Element {
  return (
    <p className={`status status-${status}`} aria-live="polite">
      {text}
    </p>
  );
}
