import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}


export default function BackButton({ to, label = 'Back', className = '' }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) navigate(to);
    else navigate(-1);
  };

  return (
    <button
      onClick={handleClick}
      className={`group flex items-center gap-3 text-white/60 hover:text-gold transition-all cursor-pointer ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center group-hover:border-gold/30 group-hover:bg-gold/10 transition-all">
        <Icon icon="back" size={14} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">{label}</span>
    </button>
  );
}
