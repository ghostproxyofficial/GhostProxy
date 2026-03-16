import clsx from 'clsx';
import { Plus, Minus } from 'lucide-react';
import { useCallback } from 'react';
import loaderStore from '/src/utils/hooks/loader/useLoaderStore';
import { useOptions } from '/src/utils/optionsContext';

const Zoom = () => {
  const { tabs, zoomLevels, setZoom, resetZoom } = loaderStore();
  const activeFrameRef = loaderStore((state) => state.activeFrameRef);
  const { options } = useOptions();

  const actab = tabs.find((tab) => tab.active);
  const currentz = actab ? zoomLevels[actab.id] || 100 : 100;
  const isNewTab = actab?.url === 'tabs://new';
  // Allow zoom for all tabs, including ghost://home (NewTab). When on the home
  // page there is no iframe, so we pass null as the frame ref – the Viewer reads
  // zoomLevels and applies a CSS transform to the NewTab wrapper instead.
  const canZoom = !!actab;
  const frameRef = isNewTab ? null : activeFrameRef;

  const zIn = useCallback(() => {
    canZoom && currentz < 200 && setZoom(actab.id, Math.min(currentz + 10, 200), frameRef);
  }, [canZoom, actab, currentz, setZoom, frameRef]);

  const zout = useCallback(() => {
    canZoom && currentz > 50 && setZoom(actab.id, Math.max(currentz - 10, 50), frameRef);
  }, [canZoom, actab, currentz, setZoom, frameRef]);

  const ressetLvl = useCallback(() => {
    canZoom && resetZoom(actab.id, frameRef);
  }, [canZoom, actab, resetZoom, frameRef]);

  return (
    <div className="w-full flex justify-between items-center px-3 py-2">
      <span className={clsx('text-[0.8rem]', !canZoom ? 'opacity-50' : undefined)}>Zoom</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={zout}
          disabled={!canZoom || currentz <= 50}
          className={clsx(
            'w-6 h-6 rounded flex items-center justify-center',
            options.type === 'light' ? 'hover:bg-gray-100' : 'hover:bg-[#ffffff0c]',
            !canZoom || currentz <= 50 ? 'opacity-50 cursor-not-allowed' : '',
          )}
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={ressetLvl}
          disabled={!canZoom}
          className={clsx(
            'text-[0.75rem] min-w-[3rem] text-center px-2 py-0.5 rounded',
            options.type === 'light' ? 'hover:bg-gray-100' : 'hover:bg-[#ffffff0c]',
            !canZoom ? 'opacity-50 cursor-not-allowed' : '',
          )}
        >
          {currentz}%
        </button>
        <button
          type="button"
          onClick={zIn}
          disabled={!canZoom || currentz >= 200}
          className={clsx(
            'w-6 h-6 rounded flex items-center justify-center',
            options.type === 'light' ? 'hover:bg-gray-100' : 'hover:bg-[#ffffff0c]',
            !canZoom || currentz >= 200 ? 'opacity-50 cursor-not-allowed' : '',
          )}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

export default Zoom;
