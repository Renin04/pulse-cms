import Link from 'next/link';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from 'react';
import styles from './PulseStarButton.module.css';

type Variant = 'primary' | 'secondary';

type VariantStyle = {
  color: string;
  speed: string;
  thickness: number;
};

type SharedProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  variant?: Variant;
  color?: string;
  speed?: string;
  thickness?: number;
};

type LinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className'> & {
    href: string;
  };

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & {
    href?: undefined;
  };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const variantStyles: Record<Variant, VariantStyle> = {
  primary: {
    color: 'rgba(255, 230, 149, 0.98)',
    speed: '3.2s',
    thickness: 1.5,
  },
  secondary: {
    color: 'rgba(255, 40, 0, 0.92)',
    speed: '4s',
    thickness: 1.25,
  },
};

function ButtonInner({
  children,
  innerClassName,
  color,
  speed,
}: {
  children: ReactNode;
  innerClassName?: string;
  color: string;
  speed: string;
}) {
  return (
    <>
      <span
        className={styles.glowBottom}
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <span
        className={styles.glowTop}
        aria-hidden="true"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <span className={cx(styles.inner, innerClassName)}>{children}</span>
    </>
  );
}

export default function PulseStarButton(props: LinkProps | ButtonProps) {
  if ('href' in props && props.href) {
    const {
      children,
      className,
      innerClassName,
      variant = 'primary',
      color,
      speed,
      thickness,
      href,
      target,
      rel,
      onClick,
      style,
      ...rest
    } = props as LinkProps & { style?: CSSProperties };
    const resolved = variantStyles[variant];
    const rootClassName = cx(styles.root, styles[variant], className);
    const rootStyle = {
      '--pulse-star-thickness': `${thickness ?? resolved.thickness}px`,
      ...style,
    } as CSSProperties;
    const isExternal = href.startsWith('http') || href.startsWith('mailto:');

    if (isExternal) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          onClick={onClick}
          className={rootClassName}
          style={rootStyle}
          {...rest}
        >
          <ButtonInner
            innerClassName={innerClassName}
            color={color ?? resolved.color}
            speed={speed ?? resolved.speed}
          >
            {children}
          </ButtonInner>
        </a>
      );
    }

    return (
      <Link href={href} onClick={onClick} className={rootClassName} style={rootStyle}>
        <ButtonInner
          innerClassName={innerClassName}
          color={color ?? resolved.color}
          speed={speed ?? resolved.speed}
        >
          {children}
        </ButtonInner>
      </Link>
    );
  }

  const {
    children,
    className,
    innerClassName,
    variant = 'primary',
    color,
    speed,
    thickness,
    type = 'button',
    onClick,
    style,
    ...rest
  } = props as ButtonProps & { style?: CSSProperties };
  const resolved = variantStyles[variant];
  const rootClassName = cx(styles.root, styles[variant], className);
  const rootStyle = {
    '--pulse-star-thickness': `${thickness ?? resolved.thickness}px`,
    ...style,
  } as CSSProperties;

  return (
    <button
      type={type}
      onClick={onClick}
      className={rootClassName}
      style={rootStyle}
      {...rest}
    >
      <ButtonInner
        innerClassName={innerClassName}
        color={color ?? resolved.color}
        speed={speed ?? resolved.speed}
      >
        {children}
      </ButtonInner>
    </button>
  );
}
