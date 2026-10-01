import clsx from 'clsx';
import { Dialog, DialogPanel, DialogTitle, Button, Input, Label, Field } from '@headlessui/react';
import { useOptions } from '/src/utils/optionsContext';
import { useState, useEffect } from 'react';

const PanicKeyDialog = ({ state, set }) => {
  const { options, updateOption } = useOptions();
  const [form, setForm] = useState({
    key: '',
    url: '',
  });

  useEffect(() => {
    if (state) {
      const saved = options.panic || { key: '', url: '' };
      setForm(saved);
    }
  }, [state, options.panic]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      e.preventDefault();
      let combo = [];
      if (e.ctrlKey) combo.push('Ctrl');
      if (e.altKey) combo.push('Alt');
      if (e.shiftKey) combo.push('Shift');
      if (e.metaKey) combo.push('Meta');
      combo.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
      setForm((prev) => ({ ...prev, key: combo.join('+') }));
    };

    const input = document.getElementById('panic-key-input');
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (input) input.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const regex = (link) => (/^(https?:)?\/\//.test(link) ? link : `https://${link}`);

  const action = () => {
    set(false);
    updateOption({
      panic: {
        key: form.key,
        url: regex(form.url.trim()),
      },
    });
    location.reload();
  };

  const filled = form.key && form.url;

  return (
    <Dialog open={state} onClose={() => set(false)} className="fixed inset-0 bg-black/40 z-50">
      <div className="flex justify-center items-center h-full">
        <DialogPanel
          className="ghost-glass w-[30rem] h-64 p-5 rounded-xl relative flex flex-col gap-3 shadow-2xl"
          style={{ backgroundColor: options.quickModalBgColor || '#252f3e' }}
        >
          <DialogTitle className="text-[1rem] mb-1">Set Panic Key</DialogTitle>

          <Field>
            <Label className="text-[0.7rem]">Shortcut Key</Label>
            <Input
              id="panic-key-input"
              className={clsx(
                'w-full h-10 pl-3 rounded-lg outline-0 border',
                options.type === 'dark' ? 'bg-black/40' : 'bg-black/15',
              )}
              value={form.key}
              onChange={() => {}} // block typing
            />
          </Field>

          <Field>
            <Label className="text-[0.7rem]">Redirect URL</Label>
            <Input
              className={clsx(
                'w-full h-10 pl-3 rounded-md outline-0 border',
                options.type === 'dark' ? 'bg-black/40' : 'bg-black/15',
              )}
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
            />
          </Field>

          <div className="absolute bottom-5 right-5 flex flex-row gap-5">
            <Button
              onClick={() => set(false)}
              className="cursor-pointer duration-150 hover:opacity-80"
            >
              Cancel
            </Button>
            <Button
              onClick={filled ? action : undefined}
              className={clsx(
                filled ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-70',
                'duration-150',
              )}
            >
              Confirm
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default PanicKeyDialog;
