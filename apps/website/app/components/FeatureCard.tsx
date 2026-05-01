import Link from 'next/link';
import { ArrowRight, LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

export default function FeatureCard({ icon: Icon, title, description, href }: FeatureCardProps) {
  return (
    <Link 
      href={href}
      className="group block bg-white rounded-xl p-6 border border-[var(--neutral-200)] shadow-sm hover:shadow-lg hover:border-[var(--pulse-red)]/20 transition-all duration-300"
    >
      <div className="w-12 h-12 rounded-lg bg-[var(--pulse-jasmine)] flex items-center justify-center mb-4 group-hover:bg-[var(--pulse-red)] transition-colors duration-300">
        <Icon className="w-6 h-6 text-[var(--pulse-black)] group-hover:text-white transition-colors duration-300" />
      </div>
      
      <h3 className="text-xl font-semibold text-[var(--pulse-black)] mb-2 group-hover:text-[var(--pulse-red)] transition-colors">
        {title}
      </h3>
      
      <p className="text-[var(--neutral-600)] mb-4 leading-relaxed">
        {description}
      </p>
      
      <span className="inline-flex items-center text-[var(--pulse-red)] font-medium text-sm group-hover:gap-2 transition-all">
        Learn more
        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
      </span>
    </Link>
  );
}
