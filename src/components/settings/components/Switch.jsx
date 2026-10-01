import { Switch } from '@headlessui/react';
import { useEffect, useState } from 'react';
import { useOptions } from '/src/utils/optionsContext';
import clsx from 'clsx';

export default function SwitchComponent({ action, value, size = 'md' }) {
  const { options } = useOptions();
  const isLight =
    options?.type === 'light' || options?.theme === 'light' || options?.themeName === 'lightTheme';
  const [enabled, setEnabled] = useState(value);
  useEffect(() => {
    setEnabled(Boolean(value));
  }, [value]);

  const switchChange = (value) => {
    setEnabled(value);
    action(value);
  };

  const sizeMap = {
    sm: {
      track: 'h-6 w-11 p-[3px]',
      knob: 'size-4 group-data-checked:translate-x-5',
    },
    md: {
      track: 'h-7 w-14 p-1',
      knob: 'size-5 group-data-checked:translate-x-7',
    },
  };

  const cfg = sizeMap[size] || sizeMap.md;

  return (
    <Switch
      checked={enabled}
      onChange={switchChange}
      className={clsx(
        'group relative flex cursor-pointer rounded-full ease-in-out focus:outline-none border transition-all duration-200',
        isLight ? 'border-black/15' : 'border-white/20',
        cfg.track,
      )}
      style={{
        backgroundColor: enabled
          ? options.switchEnabledColor || '#4c6c91'
          : options.switchColor || '#ffffff1a',
        transition: 'background-color 0.2s ease-in-out',
      }}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'pointer-events-none inline-block translate-x-0 rounded-full ring-0 transition duration-200 ease-in-out shadow-sm',
          isLight && !enabled ? 'bg-[#94a3b8]' : 'bg-white',
          cfg.knob,
        )}
      />
    </Switch>
  );
}
