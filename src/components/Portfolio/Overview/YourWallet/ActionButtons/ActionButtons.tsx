import { TooltipHover } from '@common/TooltipHover/TooltipHover'
import { Box } from '@mui/material'
import { horizontalSwapIcon, newTabBtnIcon, plusIcon } from '@static/icons'
import { NetworkType, USDC_MAIN, USDC_TEST, WSOL_MAIN, WSOL_TEST } from '@store/consts/static'
import { StrategyConfig, WalletToken } from '@store/types/userOverview'
import { addressToTicker, ROUTES } from '@utils/utils'
import { useNavigate } from 'react-router-dom'
import { useStyles } from './styles'
import { useMemo } from 'react'

interface IActionButtons {
  pool: WalletToken
  strategy: StrategyConfig
  currentNetwork: NetworkType
}

export const ActionButtons = ({ pool, strategy, currentNetwork }: IActionButtons) => {
  const navigate = useNavigate()
  const { classes } = useStyles()

  const networkUrl = useMemo(() => {
    switch (currentNetwork) {
      case NetworkType.Mainnet:
        return '?cluster=mainnet-alpha'
      case NetworkType.Testnet:
        return '?cluster=testnet.v1'
      default:
        return '?cluster=testnet.v1'
    }
  }, [currentNetwork])

  return (
    <>
      <TooltipHover title='Add Position'>
        <Box
          className={classes.actionIcon}
          onClick={() => {
            const sourceToken = addressToTicker(currentNetwork, strategy.tokenAddressA)
            const targetToken =
              strategy.tokenAddressB ?? sourceToken === 'SOL'
                ? currentNetwork === NetworkType.Mainnet
                  ? USDC_MAIN.address
                  : USDC_TEST.address
                : currentNetwork === NetworkType.Mainnet
                  ? WSOL_MAIN.address
                  : WSOL_TEST.address

            navigate(
              ROUTES.getNewPositionRoute(
                sourceToken,
                addressToTicker(currentNetwork, targetToken.toString()),
                strategy.feeTier
              ),
              {
                state: { referer: 'portfolio' }
              }
            )
          }}>
          <img src={plusIcon} height={24} width={24} alt='Add' />
        </Box>
      </TooltipHover>
      <TooltipHover title='Exchange'>
        <Box
          className={classes.actionIcon}
          onClick={() => {
            const sourceToken = addressToTicker(currentNetwork, pool.id.toString())
            const targetToken =
              sourceToken === 'SOL'
                ? currentNetwork === NetworkType.Mainnet
                  ? USDC_MAIN.address
                  : USDC_TEST.address
                : currentNetwork === NetworkType.Mainnet
                  ? WSOL_MAIN.address
                  : WSOL_TEST.address
            navigate(
              ROUTES.getExchangeRoute(
                sourceToken,
                addressToTicker(currentNetwork, targetToken.toString())
              ),

              {
                state: { referer: 'portfolio' }
              }
            )
          }}>
          <img src={horizontalSwapIcon} height={24} width={24} alt='Add' />
        </Box>
      </TooltipHover>
      <TooltipHover title='Open in explorer'>
        <Box
          className={classes.actionIcon}
          onClick={() => {
            window.open(
              `https://explorer.sonic.game/address/${pool.id.toString()}/${networkUrl}`,
              '_blank',
              'noopener,noreferrer'
            )
          }}>
          <img width={24} height={24} src={newTabBtnIcon} alt={'Exchange'} />
        </Box>
      </TooltipHover>
    </>
  )
}
