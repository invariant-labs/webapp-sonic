import React, { useMemo } from 'react'
import { Box, Grid, Typography } from '@mui/material'
import { useStyles } from './../styles'
import { SwapToken } from '@store/selectors/solanaWallet'
import {
  copyAddressIcon,
  newTabIcon,
  selectTokenIcon,
  unknownTokenIcon,
  warningIcon
} from '@static/icons'
import { formatNumberWithSuffix } from '@utils/utils'
import { VariantType } from 'notistack'
import { TooltipHover } from '@common/TooltipHover/TooltipHover'
import { NetworkType } from '@store/consts/static'
interface IProps {
  token: SwapToken | null
  network: NetworkType
  tokenPrice?: number
  copyTokenAddressHandler: (message: string, variant: VariantType) => void
}

const SingleToken: React.FC<IProps> = ({ token, network, tokenPrice, copyTokenAddressHandler }) => {
  const { classes } = useStyles({ isToken: !!token })

  const copyToClipboard = () => {
    if (!token) return
    navigator.clipboard
      .writeText(token.assetAddress.toString())
      .then(() => {
        copyTokenAddressHandler('Address copied to Clipboard', 'success')
      })
      .catch(() => {
        copyTokenAddressHandler('Failed to copy address to Clipboard', 'error')
      })
  }

  const networkUrl = useMemo(() => {
    switch (network) {
      case NetworkType.Mainnet:
        return '?cluster=mainnet-alpha'
      case NetworkType.Testnet:
        return '?cluster=testnet.v1'
      default:
        return '?cluster=testnet.v1'
    }
  }, [network])

  return (
    <Grid className={classes.token}>
      <Grid container className={classes.innerToken}>
        {token?.logoURI ? (
          <Box className={classes.imageContainer}>
            <img
              className={classes.tokenIcon}
              src={token.logoURI ?? unknownTokenIcon}
              loading='lazy'
              alt={token.name + 'logo'}
              onError={e => {
                e.currentTarget.src = unknownTokenIcon
              }}
            />
            {token.isUnknown && <img className={classes.warningIcon} src={warningIcon} />}
          </Box>
        ) : (
          <img
            className={classes.tokenIcon}
            src={selectTokenIcon}
            alt={'Select token'}
            onError={e => {
              e.currentTarget.src = unknownTokenIcon
            }}
          />
        )}

        <Grid>
          <Grid container direction='row' alignItems='center' gap='6px' wrap='nowrap' pr={1}>
            <Typography className={classes.tokenName}>
              {token?.symbol ? token.symbol : 'Select a token'}{' '}
            </Typography>

            {token && (
              <TooltipHover title='Token details'>
                <a
                  href={`https://explorer.sonic.game/address/${token.assetAddress.toString()}${networkUrl}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={event => {
                    event.stopPropagation()
                  }}
                  className={classes.link}>
                  <img width={8} height={8} src={newTabIcon} alt={'Token address'} />
                </a>
              </TooltipHover>
            )}
          </Grid>
          <Typography className={classes.tokenDescription}>
            {token?.name ? token.name : '--'}
          </Typography>
        </Grid>
      </Grid>

      <Grid className={classes.rightItems}>
        <Typography className={classes.price}>
          {token ? (tokenPrice ? '$' + formatNumberWithSuffix(tokenPrice) : 'No data') : '--'}
        </Typography>
        <TooltipHover title='Copy'>
          <Grid className={classes.tokenAddress} onClick={copyToClipboard}>
            <Typography>
              {token
                ? token.assetAddress.toString().slice(0, 4) +
                  '...' +
                  token.assetAddress.toString().slice(-5, -1)
                : '--'}
            </Typography>
            <img
              width={8}
              height={8}
              src={copyAddressIcon}
              alt={'Copy address'}
              className={classes.clipboardIcon}
            />
          </Grid>
        </TooltipHover>
      </Grid>
    </Grid>
  )
}

export default SingleToken
