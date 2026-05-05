import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  label: string;
  variant: ButtonVariant;
};

export function Button({ icon, label, variant, className, ...props }: ButtonProps): JSX.Element {
  const buttonClassName = className ? `${variant}-button ${className}` : `${variant}-button`;

  return (
    <button className={buttonClassName} type="button" {...props}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
