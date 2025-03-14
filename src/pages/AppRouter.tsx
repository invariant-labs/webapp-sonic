import { useSelector } from 'react-redux'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
  RouterProvider
} from 'react-router-dom'
import { NetworkType } from '@store/consts/static'
import { network } from '@store/selectors/solanaConnection'
import ListPage from './ListPage/ListPage'
import NewPositionPage from './NewPositionPage/NewPositionPage'
import PortfolioPage from './PortfolioPage/PortfolioPage'
import RootPage from './RootPage'
import SinglePositionPage from './SinglePositionPage/SinglePositionPage'
import TokenCreatorPage from './TokenCreatorPage/TokenCreatorPage'
import StatsPage from './StatsPage/StatsPage'
import SwapPage from './SwapPage/SwapPage'
import { ROUTES } from '@utils/utils'

const createRouter = (currentNetwork: NetworkType) =>
  createBrowserRouter(
    createRoutesFromElements(
      <Route path={ROUTES.ROOT} element={<RootPage />}>
        <Route path={ROUTES.EXCHANGE_WITH_PARAMS} element={<SwapPage />} />
        <Route path={ROUTES.LIQUIDITY} element={<ListPage />} />
        <Route path={ROUTES.STATISTICS} element={<StatsPage />} />
        <Route path={ROUTES.NEW_POSITION_WITH_PARAMS} element={<NewPositionPage />} />
        <Route path={ROUTES.POSITION_WITH_ID} element={<SinglePositionPage />} />
        <Route path={ROUTES.PORTFOLIO} element={<PortfolioPage />} />
        {currentNetwork === NetworkType.Testnet && (
          <Route path={ROUTES.CREATOR} element={<TokenCreatorPage />} />
        )}
        <Route path='*' element={<Navigate to={ROUTES.EXCHANGE} replace />} />
      </Route>
    )
  )

export const AppRouter = () => {
  const currentNetwork = useSelector(network)
  const router = createRouter(currentNetwork)

  return <RouterProvider router={router} />
}
