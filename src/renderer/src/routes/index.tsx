import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { PageSkeleton } from '@renderer/components/base/skeleton'

import Proxies from '@renderer/pages/proxies'

const Connections = lazy(() => import('@renderer/pages/connections'))
const Rules = lazy(() => import('@renderer/pages/rules'))
const Logs = lazy(() => import('@renderer/pages/logs'))
const Profiles = lazy(() => import('@renderer/pages/profiles'))
const Settings = lazy(() => import('@renderer/pages/settings'))
const Override = lazy(() => import('@renderer/pages/override'))
const Mihomo = lazy(() => import('@renderer/pages/mihomo'))
const Sysproxy = lazy(() => import('@renderer/pages/syspeoxy'))
const Tun = lazy(() => import('@renderer/pages/tun'))
const Resources = lazy(() => import('@renderer/pages/resources'))
const DNS = lazy(() => import('@renderer/pages/dns'))
const Sniffer = lazy(() => import('@renderer/pages/sniffer'))
const SubStore = lazy(() => import('@renderer/pages/substore'))

const LazyPage: React.FC<{ component: React.LazyExoticComponent<React.ComponentType> }> = ({
  // eslint-disable-next-line react/prop-types
  component: Component
}) => (
  <Suspense fallback={<PageSkeleton />}>
    <Component />
  </Suspense>
)

const routes = [
  { path: '/proxies', element: <Proxies /> },
  { path: '/connections', element: <LazyPage component={Connections} /> },
  { path: '/rules', element: <LazyPage component={Rules} /> },
  { path: '/logs', element: <LazyPage component={Logs} /> },
  { path: '/profiles', element: <LazyPage component={Profiles} /> },
  { path: '/settings', element: <LazyPage component={Settings} /> },
  { path: '/override', element: <LazyPage component={Override} /> },
  { path: '/mihomo', element: <LazyPage component={Mihomo} /> },
  { path: '/sysproxy', element: <LazyPage component={Sysproxy} /> },
  { path: '/tun', element: <LazyPage component={Tun} /> },
  { path: '/resources', element: <LazyPage component={Resources} /> },
  { path: '/dns', element: <LazyPage component={DNS} /> },
  { path: '/sniffer', element: <LazyPage component={Sniffer} /> },
  { path: '/substore', element: <LazyPage component={SubStore} /> },
  { path: '/', element: <Navigate to="/proxies" /> }
]

export default routes
