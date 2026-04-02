import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import FragenPage from "./pages/FragenPage";
import HaeufigeFragenPage from "./pages/HaeufigeFragenPage";
import LandingPage from "./pages/LandingPage";
import MusterschreibenPage from "./pages/MusterschreibenPage";
import WelcomePage from "./pages/WelcomePage";
import ZahlungPage from "./pages/ZahlungPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

// No validateSearch here – AuthPage reads URL params directly via window.location.search
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: AuthPage,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/app",
  component: Dashboard,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/welcome",
  component: WelcomePage,
});

const fragenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/fragen",
  component: FragenPage,
});

const zahlungRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/zahlung",
  component: ZahlungPage,
});

const musterschreibenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/musterschreiben",
  component: MusterschreibenPage,
});

const haeufigeFragenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/haeufige-fragen",
  component: HaeufigeFragenPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  authRoute,
  appRoute,
  adminRoute,
  welcomeRoute,
  fragenRoute,
  zahlungRoute,
  musterschreibenRoute,
  haeufigeFragenRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
