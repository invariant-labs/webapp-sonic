import React from 'react'
import useStyles from './style'
import { Button, Grid, Popover, Typography } from '@mui/material'

export interface IPositionViewActionPopover {
  open: boolean
  anchorEl: HTMLButtonElement | null
  unclaimedFeesInUSD: number
  closePosition: () => void
  claimFee: () => void
  handleClose: () => void
  onLockPosition: () => void
  createPosition: () => void
  isLocked: boolean
  shouldDisable: boolean
}

export const PositionViewActionPopover: React.FC<IPositionViewActionPopover> = ({
  anchorEl,
  open,
  handleClose,
  isLocked,
  claimFee,
  closePosition,
  onLockPosition,
  createPosition,
  unclaimedFeesInUSD,
  shouldDisable
}) => {
  const { classes, cx } = useStyles()
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      classes={{ paper: classes.paper }}
      onClose={handleClose}
      slotProps={{
        root: {
          onClick: e => e.stopPropagation()
        }
      }}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}>
      <Grid className={classes.root}>
        <Grid className={classes.list} container alignContent='space-around' direction='column'>
          <Button className={cx(classes.listItem)} onClick={createPosition}>
            <Typography className={classes.name}>Create position</Typography>
          </Button>
          <Button
            disabled={unclaimedFeesInUSD <= 0 || shouldDisable}
            className={cx(classes.listItem)}
            onClick={() => {
              claimFee()
              handleClose()
            }}>
            <Typography className={classes.name}>Claim fee</Typography>
          </Button>
          <Button
            className={cx(classes.listItem)}
            disabled={isLocked || shouldDisable}
            onClick={() => {
              closePosition()
              handleClose()
            }}>
            <Typography className={classes.name}>Close position</Typography>
          </Button>
        </Grid>
        <Button
          className={cx(classes.listItem)}
          disabled={isLocked || shouldDisable}
          onClick={() => {
            onLockPosition()
            handleClose()
          }}>
          <Typography className={classes.name}>Lock position</Typography>
        </Button>
      </Grid>
    </Popover>
  )
}

export default PositionViewActionPopover
