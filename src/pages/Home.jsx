import Nav from '../layouts/Nav';
import Search from '../components/SearchContainer';
import Footer from '../components/Footer';
import QuickLinks from '../components/QuickLinks';
import { memo, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useOptions } from '/src/utils/optionsContext';

const Home = memo(() => {
  const HOME_HERO_SCALE = 1.1;
  const [showDocsPopup, setShowDocsPopup] = useState(false);
  const { options } = useOptions();
  const popupBg = options.quickModalBgColor || options.menuColor || '#252f3e';
  const popupText = options.siteTextColor || '#a0b0c8';
  const isLightTheme =
    options.type === 'light' ||
    options.theme === 'light' ||
    options.themeName === 'light';
  const popupPrimaryBg = isLightTheme ? '#3d4654' : '#3a3f48';
  const popupPrimaryText = '#f6f8fc';

  useEffect(() => {
    const dismissed = localStorage.getItem('ghostDocsPopupDismissed');
    if (!dismissed) {
      setShowDocsPopup(true);
    }
  }, []);

  const closePopup = () => setShowDocsPopup(false);

  const dismissForever = () => {
    localStorage.setItem('ghostDocsPopupDismissed', 'true');
    setShowDocsPopup(false);
  };

  return (
    <>
      <Nav />
      <div className="relative min-h-full flex-1 flex flex-col items-center justify-center gap-6 pb-24">
        <div
          className="w-full flex flex-col items-center gap-6"
          style={{ transform: `scale(${HOME_HERO_SCALE})`, transformOrigin: 'center center' }}
        >
          <Search cls="w-full px-20 py-0 flex flex-col items-center z-40" />
          <QuickLinks cls="w-full max-w-[40rem] mx-auto" />
        </div>
      </div>
      {showDocsPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={closePopup} />
          <div
            className="relative w-full max-w-xl rounded-lg border border-white/10 shadow-lg overflow-hidden"
            style={{ backgroundColor: popupBg, color: popupText }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h2 className="text-lg font-medium">Please read the Docs!</h2>
              <button
                onClick={closePopup}
                className={clsx('p-1 rounded-md duration-150 hover:bg-[#ffffff0c]')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 text-sm space-y-4">
              <p>
                Welcome to Ghost. To have the best experience, we reccomend you first read the
                docs (button in the bottom left). It has info on how to use Ghost, and answers
                potential questions.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={dismissForever}
                  className="px-3 py-2 rounded-md border border-transparent hover:brightness-110 duration-150"
                  style={{ backgroundColor: popupPrimaryBg, color: popupPrimaryText }}
                >
                  Don&apos;t show this again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
});

Home.displayName = 'Home';
export default Home;
