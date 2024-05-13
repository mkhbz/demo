
import { getTokenFromCookie, jwtToCookie } from 'services/utils';

// sso check
const loaderInterceptor = () => {
  const jwtTokenStr = new URLSearchParams(location.search).get('t');
  if (jwtTokenStr) {
    jwtToCookie(jwtTokenStr);
  }
  const tokenInfo = getTokenFromCookie();
  if (!tokenInfo && !jwtTokenStr) {
    window.location.href = ROUTES.LOGIN;
  }
  return null;
};
/**
 * Ensure the page title is updated correctly when the route changes
 * We follow the convention of "Page Title | App Title"
 */
const HelmetTitle = () => {
  const location = useLocation();
  const appTitle = 'ISD Digital Twin';
  const routeName = getPageTitleFromUrl(location.pathname);
  const title = routeName ? `${routeName} | ${appTitle}` : appTitle;

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
};

const WAIT_TIME_OF_RESIZE_OBSERVER = 16;

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route element={<LoginPage />} path={ROUTES.LOGIN} />
      <Route
        element={<DashboardPage />}
        loader={() => {
          return loaderInterceptor();
        }}
        path={ROUTES.DASHBOARD}
      />
      <Route
        element={
          <>
            <HelmetProvider>
              <HelmetTitle />
              <Header />
            </HelmetProvider>
            <Outlet />
          </>
        }>
        <Route
          loader={() => {
            return loaderInterceptor();
          }}
          element={
            <>
              <Navbar navItems={navItems} />
              <Outlet />
            </>
          }>
          <Route element={<ReportDetailPae />} path={ROUTES.REPORT_DETAIL} />
          <Route element={<ReportListPage />} path={ROUTES.RUN_REPORTS} />
        </Route>
        <Route element={<Navigate replace to={ROUTES.DASHBOARD} />} path="*" />
      </Route>
    </Route>
  )
);

const App: React.FC = () => {
  // This is to fix the ResizeObserver loop completed with undelivered notifications issue
  const _ResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class ResizeObserver extends _ResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      callback = debounce(callback, WAIT_TIME_OF_RESIZE_OBSERVER);
      super(callback);
    }
  };

  return (
    <NextUIProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </NextUIProvider>
  );
};

export default App;
