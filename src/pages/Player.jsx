import Breadcrumb from '../components/player/Breadcrumb';
import Loader from '../components/player/Loader';
import { useLocation, Navigate } from 'react-router-dom';
import { useOptions } from '/src/utils/optionsContext';

const Player = () => {
  const location = useLocation();
  const app = location.state?.app;
  const { options } = useOptions();

  //handling when directly nav to /discover/r/
  if (!app) {
    return <Navigate to="/discover" replace />;
  }

  return (
    <div className="h-[100dvh] overflow-y-auto scrollbar scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-600">
      <div className="max-w-7xl w-[95%] aspect-video mx-auto flex flex-col gap-4 mt-4 mb-8">
        <Breadcrumb
          theme={options.theme}
          name={app.appName}
          sourceKey={app.sourceKey}
          returnTo={app.returnTo}
        />
        <Loader theme={options.theme} app={app} />
      </div>
    </div>
  );
};

export default Player;
