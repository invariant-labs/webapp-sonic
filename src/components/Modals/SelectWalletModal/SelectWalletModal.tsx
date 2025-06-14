import React, { useMemo } from 'react'
import { Button, Grid, Popover, Typography, Divider, Box } from '@mui/material'
import useStyles from './styles'
import { walletNames } from '@store/consts/static'
import { WalletType } from '@store/consts/types'
import { openWalletSelectorModal } from '@utils/web3/selector'
import { changeToNightlyAdapter, connectStaticWallet } from '@utils/web3/wallet'
import {
  backpackWalletIcon,
  closeSmallIcon,
  connectWalletIcon,
  nightlyConnectIcon,
  nightlyIcon,
  okxLogoIcon
} from '@static/icons'
import useIsMobile from '@store/hooks/isMobile'

export interface ISelectWalletModal {
  open: boolean
  anchorEl: HTMLButtonElement | null
  handleConnect: () => void
  handleClose: () => void
  isChangeWallet: boolean
  onDisconnect: () => void
  setIsOpenSelectWallet: (isOpen: boolean) => void
}

export const SelectWalletModal: React.FC<ISelectWalletModal> = ({
  open,
  handleConnect,
  handleClose,
  isChangeWallet,
  setIsOpenSelectWallet,
  onDisconnect
}) => {
  const detectedWallet = useMemo(() => {
    const nightly = (window as any)?.nightly
    const backpack = (window as any)?.backpack
    const okx = (window as any)?.okx

    if (nightly && !backpack && !okx) {
      return WalletType.NIGHTLY
    } else if (backpack && !nightly && !okx) {
      return WalletType.BACKPACK
    } else if (okx && !nightly && !backpack) {
      return WalletType.OKX
    } else {
      return null
    }
  }, [
    (window as any).nightly,
    (window as any).backpack,
    (window as any).okx,
    (window as any).salmon
  ])

  const isMobile = useIsMobile(true)
  const { classes } = useStyles({ isMobile: isMobile && detectedWallet !== null })

  const setWallet = (wallet: WalletType) => {
    localStorage.setItem('WALLET_TYPE', wallet.toString())
  }
  const handleConnectStaticWallet = async (wallet: WalletType) => {
    setIsOpenSelectWallet(false)
    setTimeout(async () => {
      if (isChangeWallet) {
        await (async () => onDisconnect())()
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      await connectStaticWallet(wallet)
      handleConnect()
    }, 300)
  }

  const handleNightlySelector = () => {
    setIsOpenSelectWallet(false)
    setTimeout(async () => {
      if (isChangeWallet) {
        await (async () => onDisconnect())()
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      changeToNightlyAdapter()
      await openWalletSelectorModal()
      handleConnect()
      setWallet(WalletType.NIGHTLY)
    }, 300)
  }
  return (
    <div className={classes.modalContainer}>
      <Popover
        open={open}
        marginThreshold={0}
        classes={{
          root: classes.popoverRoot,
          paper: classes.paper
        }}
        anchorEl={document.body}
        onClose={handleClose}>
        <Box className={classes.root}>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems={isMobile && detectedWallet !== null ? 'center' : 'end'}
            mb={isMobile && detectedWallet !== null ? 3 : 0}>
            {(!isMobile || detectedWallet === null) && <Box width={16} />}
            <Typography className={classes.title}>Connect your wallet</Typography>

            <Grid
              className={classes.topCloseButton}
              onClick={() => {
                setIsOpenSelectWallet(false)
              }}>
              <img width={16} src={closeSmallIcon} alt='Close'></img>
            </Grid>
          </Box>
          {detectedWallet && isMobile ? (
            <>
              <Typography className={classes.mobileSubtitle}>
                Connect your wallet to interact with Invariant!
              </Typography>
              <Box
                className={classes.mobileWallet}
                onClick={async () => {
                  if (detectedWallet === WalletType.NIGHTLY) {
                    handleNightlySelector()
                  } else {
                    handleConnectStaticWallet(detectedWallet)
                  }
                }}>
                <img src={connectWalletIcon} alt='Connect wallet' />
                <Typography>Connect</Typography>
              </Box>
            </>
          ) : (
            <>
              <Grid className={classes.buttonWrapper}>
                <Typography className={classes.subTitle}>
                  Connect using Nightly's auto-detection
                </Typography>
                <Grid className={classes.buttonList}>
                  <Grid
                    item
                    className={classes.button}
                    onClick={() => {
                      handleNightlySelector()
                    }}>
                    <Typography className={classes.buttonName}>
                      <img
                        width={53}
                        rel='preload'
                        src={nightlyConnectIcon}
                        alt='nightly connect logo'></img>
                      {walletNames[WalletType.NIGHTLY]}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <Divider className={classes.divider} />
              <Grid className={classes.buttonWrapper}>
                <Typography className={classes.subTitle}>
                  Or connect with popular wallets{' '}
                </Typography>
                <Grid className={classes.buttonList}>
                  <Grid
                    item
                    className={classes.button}
                    onClick={async () => {
                      handleConnectStaticWallet(WalletType.BACKPACK)
                    }}>
                    <Grid className={classes.buttonContainer}>
                      <Typography className={classes.buttonName}>
                        <img
                          width={45}
                          rel='preload'
                          src={backpackWalletIcon}
                          alt='backpack wallet icon'></img>

                        {walletNames[WalletType.BACKPACK]}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid
                    item
                    className={classes.button}
                    onClick={async () => {
                      handleConnectStaticWallet(WalletType.NIGHTLY_WALLET)
                    }}>
                    <Grid className={classes.buttonContainer}>
                      <Typography className={classes.buttonName}>
                        <img
                          width={45}
                          rel='preload'
                          src={nightlyIcon}
                          alt='nightly wallet icon'></img>

                        {walletNames[WalletType.NIGHTLY_WALLET]}
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid
                    item
                    className={classes.button}
                    onClick={async () => {
                      handleConnectStaticWallet(WalletType.OKX)
                    }}>
                    <Grid className={classes.buttonContainer}>
                      <Typography className={classes.buttonName}>
                        <img width={45} rel='preload' src={okxLogoIcon} alt='Close'></img>
                        {walletNames[WalletType.OKX]}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
              <Divider className={classes.divider} />
              <Grid className={classes.modalFooter}>
                <Typography className={classes.footerTitle}>Don't have a wallet?</Typography>
                <a href={' https://nightly.app/'} target='_blank'>
                  <Button className={classes.buttonPrimary} variant='contained'>
                    Download one!
                  </Button>
                </a>
              </Grid>
            </>
          )}
        </Box>
      </Popover>
    </div>
  )
}
export default SelectWalletModal
