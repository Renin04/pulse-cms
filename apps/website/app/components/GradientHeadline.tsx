'use client';

interface GradientHeadlineProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
}

export default function GradientHeadline({
  children,
  className = '',
  colors = ['#FF2800', '#FF9F4A', '#FFE695', '#FF2800'],
}: GradientHeadlineProps) {
  const gradient = colors.join(', ');

  return (
    <span
      className={`gradient-headline ${className}`}
      style={{ backgroundImage: `linear-gradient(90deg, ${gradient})` }}
    >
      {children}
    </span>
  );
}
