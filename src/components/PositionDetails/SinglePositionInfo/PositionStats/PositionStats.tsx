import { Box, Skeleton, Typography } from '@mui/material'
import { useStyles } from './style'
import { formatNumberWithSuffix } from '@utils/utils'

type Props = {
  value: number
  pendingFees: number
  poolApy: number
  isLoading: boolean
}

export const PositionStats = ({ value, pendingFees, poolApy, isLoading }: Props) => {
  const { classes, cx } = useStyles()

  return (
    <Box className={classes.container}>
      <Box className={classes.statWrapper}>
        <Box className={classes.statContainer}>
          <Typography className={classes.statName}>Value:</Typography>
          {isLoading ? (
            <Skeleton variant='rounded' width={38} height={17} />
          ) : (
            <Typography className={classes.statValue}>
              $
              {+formatNumberWithSuffix(value, { noDecimals: true, decimalsAfterDot: 18 }) < 1000
                ? (+formatNumberWithSuffix(value, {
                    noDecimals: true,
                    decimalsAfterDot: 18
                  })).toFixed(2)
                : formatNumberWithSuffix(value)}
            </Typography>
          )}
        </Box>
        <Box className={classes.statContainer}>
          <Typography className={classes.statName}>Pending fees:</Typography>
          {isLoading ? (
            <Skeleton variant='rounded' width={36} height={17} />
          ) : (
            <Typography className={classes.statValue}>
              $
              {+formatNumberWithSuffix(pendingFees, { noDecimals: true, decimalsAfterDot: 18 }) <
              1000
                ? (+formatNumberWithSuffix(pendingFees, {
                    noDecimals: true,
                    decimalsAfterDot: 18
                  })).toFixed(2)
                : formatNumberWithSuffix(pendingFees)}
            </Typography>
          )}
        </Box>
      </Box>
      <Box className={classes.statWrapper}>
        <Box className={cx(classes.statContainer, classes.statContainerHiglight)}>
          <Typography className={classes.statName}>Pool APY:</Typography>
          <Typography className={cx(classes.statValue, classes.statValueHiglight)}>
            {poolApy.toFixed(2)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
