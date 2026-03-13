import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getDialogEventName } from '/src/utils/uiDialog';
import { useOptions } from '/src/utils/optionsContext';

const DialogHost = () => {
  const [dialog, setDialog] = useState(null);
  const { options } = useOptions();

  useEffect(() => {
    const eventName = getDialogEventName();
    const handler = (event) => {
      setDialog(event.detail || null);
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, []);

  if (!dialog) return null;

  const close = (result) => {
    try {
      dialog.resolve?.(result);
    } catch {}
    setDialog(null);
  };

  const isConfirm = dialog.type === 'confirm';
  const isLightTheme =
    options.type === 'light' ||
    options.theme === 'light' ||
    options.themeName === 'light';
  const panelBg = options.quickModalBgColor || options.menuColor || (isLightTheme ? '#eff4fb' : '#252f3e');
  const textColor = options.siteTextColor || (isLightTheme ? '#1f2b3f' : '#d3ddef');
  const panelBorder = isLightTheme ? 'rgba(15,23,42,0.16)' : 'rgba(255,255,255,0.12)';
  const secondaryBg = isLightTheme ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.12)';
  const secondaryBorder = isLightTheme ? 'rgba(15,23,42,0.14)' : 'rgba(255,255,255,0.2)';
  const primaryBg = isLightTheme ? '#3d4654' : '#3a3f48';
  const primaryText = '#f6f8fc';

  return (
    <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/55" onClick={() => close(isConfirm ? false : undefined)} />
      <div
        className="relative w-full max-w-md rounded-xl border shadow-2xl overflow-hidden"
        style={{ backgroundColor: panelBg, color: textColor, borderColor: panelBorder }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: panelBorder }}>
          <h2 className="text-lg font-semibold">{dialog.title || (isConfirm ? 'Confirm' : 'Notice')}</h2>
          <button onClick={() => close(isConfirm ? false : undefined)} className="p-1 rounded-md hover:bg-[#ffffff12]">
            <X size={18} />
          </button>
        </div>
        <div className="px-4 py-4 text-sm leading-relaxed whitespace-pre-wrap">{dialog.message}</div>
        <div className="px-4 py-3 border-t flex items-center justify-end gap-2" style={{ borderColor: panelBorder }}>
          {isConfirm && (
            <button
              onClick={() => close(false)}
              className="h-9 px-4 rounded-md border hover:brightness-110"
              style={{ backgroundColor: secondaryBg, borderColor: secondaryBorder, color: textColor }}
            >
              Cancel
            </button>
          )}
          <button
            onClick={() => close(isConfirm ? true : undefined)}
            className="h-9 px-4 rounded-md border border-transparent hover:brightness-110"
            style={{ backgroundColor: primaryBg, color: primaryText }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogHost;
