import Link from 'next/link';
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  CSSProperties,
  ReactNode,
} from 'react';
import styles from './GlassIconButton.module.css';

type Tone = 'red' | 'jasmine' | 'charcoal';

type SharedProps = {
  icon: ReactNode;
  label: string;
  className?: string;
  iconClassName?: string;
  showLabel?: boolean;
  tone?: Tone;
};

type LinkProps = SharedProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'aria-label'> & {
    href: string;
  };

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className' | 'aria-label'> & {
    href?: undefined;
  };

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function GlassContent({
  icon,
  label,
  iconClassName,
  showLabel,
}: Pick<SharedProps, 'icon' | 'label' | 'iconClassName' | 'showLabel'>) {
  return (
    <>
      <span className={styles.back} aria-hidden="true" />
      <span className={styles.front}>
        <span className={cx(styles.icon, iconClassName)} aria-hidden="true">
          {icon}
        </span>
      </span>
      {showLabel ? (
        <span className={styles.label} aria-hidden="true">
          {label}
        </span>
      ) : null}
    </>
  );
}

export default function GlassIconButton(props: LinkProps | ButtonProps) {
  if ('href' in props && props.href) {
    const {
      icon,
      label,
      className,
      iconClassName,
      showLabel = true,
      tone = 'red',
      href,
      target,
      rel,
      onClick,
      style,
      ...rest
    } = props as LinkProps & { style?: CSSProperties };
    const rootClassName = cx(
      styles.root,
      styles[tone],
      showLabel && styles.showLabel,
      className,
    );
    const isExternal = href.startsWith('http') || href.startsWith('mailto:');

    if (isExternal) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          onClick={onClick}
          className={rootClassName}
          aria-label={label}
          style={style}
          {...rest}
        >
          <GlassContent
            icon={icon}
            label={label}
            iconClassName={iconClassName}
            showLabel={showLabel}
          />
        </a>
      );
    }

    return (
      <Link
        href={href}
        onClick={onClick}
        className={rootClassName}
        aria-label={label}
        style={style}
      >
        <GlassContent
          icon={icon}
          label={label}
          iconClassName={iconClassName}
          showLabel={showLabel}
        />
      </Link>
    );
  }

  const {
    icon,
    label,
    className,
    iconClassName,
    showLabel = true,
    tone = 'red',
    type = 'button',
    onClick,
    style,
    ...rest
  } = props as ButtonProps & { style?: CSSProperties };
  const rootClassName = cx(
    styles.root,
    styles[tone],
    showLabel && styles.showLabel,
    className,
  );

  return (
    <button
      type={type}
      onClick={onClick}
      className={rootClassName}
      aria-label={label}
      style={style}
      {...rest}
    >
      <GlassContent
        icon={icon}
        label={label}
        iconClassName={iconClassName}
        showLabel={showLabel}
      />
    </button>
  );
}
