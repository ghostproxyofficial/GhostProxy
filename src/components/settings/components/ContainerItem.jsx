import ComboBox from './Combobox';
import Switch from './Switch';
import Input from './Input';
import Button from './Button';
import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';

const SettingsContainerItem = ({
  config,
  action,
  name,
  type,
  children,
  value,
  disabled = false,
  disabledAction,
  isLast = false,
  isFirst = false,
  dividerTop = false,
  placeholder,
  inputType,
  dropdownDirection,
}) => {
  const { options } = useOptions();
  const hasDisabledAction = disabled && typeof disabledAction === 'function';

  return (
    <div
      className={clsx(
        'flex items-center gap-4 py-4 px-5 transition-colors min-w-0',
        !isLast && 'border-b border-white/5',
        isFirst && 'rounded-t-xl',
        isLast && 'rounded-b-xl',
        dividerTop && 'border-t border-white/15 mt-3',
        disabled && !hasDisabledAction && 'opacity-50 pointer-events-none',
        hasDisabledAction && 'cursor-pointer',
      )}
      onClick={hasDisabledAction ? disabledAction : undefined}
      style={{ backgroundColor: options.settingsContainerColor || '#18283e' }}
    >
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-[0.9375rem] font-medium mb-0.5 truncate">{name}</p>
        <p className="text-[0.8125rem] text-gray-400 leading-snug">{children}</p>
      </div>

      {(!disabled || hasDisabledAction) && (
        <div className={clsx('relative flex-shrink-0', disabled && hasDisabledAction && 'opacity-50 pointer-events-none')}>
          {type === 'select' && (
            <ComboBox
              config={config}
              action={action}
              selectedValue={value}
              maxW={56}
              dropdownDirection={dropdownDirection || 'down'}
              disabled={disabled}
            />
          )}
          {type === 'switch' && <Switch action={action} value={value} />}
          {type === 'input' && (
            <Input
              onChange={action}
              defValue={value}
              placeholder={placeholder}
              disabled={disabled}
              inputType={inputType}
            />
          )}
          {type === 'button' && <Button action={action} value={value} />}
        </div>
      )}
    </div>
  );
};

export default SettingsContainerItem;
