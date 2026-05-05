import type { ReactNode } from 'react';

type FieldProps = {
  children: ReactNode;
  className?: string;
  label: string;
  labelFor: string;
};

export function Field({ children, className, label, labelFor }: FieldProps): JSX.Element {
  const fieldClassName = className ? `field ${className}` : 'field';

  return (
    <div className={fieldClassName}>
      <label htmlFor={labelFor}>{label}</label>
      {children}
    </div>
  );
}
