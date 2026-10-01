// idea?
import { Dialog, DialogPanel, DialogTitle, Button } from '@headlessui/react';
import { useOptions } from '/src/utils/optionsContext';
import { useState, useEffect } from 'react';
import pkg from '/package.json';
import clsx from 'clsx';

const UpdateDialog = () => {
  const { options } = useOptions();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem('updateDialogShown');
    if (!shown && options.version !== pkg.version) {
      setOpen(true);
      sessionStorage.setItem('updateDialogShown', 'true');
    }
  }, []);

  return (
    <Dialog open={open} onClose={() => setOpen(false)} className="fixed inset-0 bg-black/40 z-50">
      <div className="flex justify-center items-center h-full">
        <DialogPanel
          className="ghost-glass w-[29rem] p-6 rounded-lg shadow-2xl flex flex-col gap-4"
          style={{ backgroundColor: options.quickModalBgColor || '#252f3e' }}
        >
          <DialogTitle className="text-[1.05rem] mb-1">Important Reminder</DialogTitle>
          <p className="text-sm" style={{ color: options.siteTextColor || '#a0b0c8' }}>
            Ghost has just been updated! Please ensure you are up-to-date by clearing your cache in
            Settings {`>`} Advanced.
          </p>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setOpen(false)}
              className={clsx('cursor-pointer hover:opacity-80', 'duration-150')}
            >
              Dismiss
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default UpdateDialog;
