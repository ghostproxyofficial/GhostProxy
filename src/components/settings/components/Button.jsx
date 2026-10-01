import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';

const Button = ({ value, action, disabled = false, maxW = 40 }) => {
  const { options } = useOptions();
  const isLight =
    options?.type === 'light' || options?.theme === 'light' || options?.themeName === 'lightTheme';

  return (
    <button
      onClick={action}
      className={clsx(
        'rounded-xl border text-[0.9rem] font-medium cursor-pointer',
        'flex items-center justify-center h-11 px-4 transition-all duration-150',
        isLight ? 'border-black/15 hover:border-black/30' : 'border-white/20 hover:border-white/30',
        'hover:opacity-95 active:opacity-90',
        disabled ? 'opacity-60' : undefined,
      )}
      style={{
        backgroundColor: options.settingsDropdownColor || '#1a2a42',
        maxWidth: `${maxW}rem`,
      }}
    >
      {value}
    </button>
  );
};

export default Button;
