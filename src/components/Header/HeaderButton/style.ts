import { Theme } from '@mui/material'
import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()((theme: Theme) => {
  return {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '100%'
    },
    headerButton: {
      background: 'transparent',
      color: colors.white.main,
      paddingInline: 12,
      borderRadius: 12,
      textTransform: 'none',
      ...typography.body1,
      height: 32,
      boxShadow: 'none',
      '&:hover': {
        background: colors.invariant.light,
        '@media (hover: none)': {
          background: 'transparent'
        }
      },

      '&:active': {
        '& #downIcon': {
          transform: 'rotateX(180deg)'
        }
      },
      [theme.breakpoints.down('sm')]: {
        paddingInline: 6
      }
    },

    label: {
      WebkitPaddingBefore: '2px'
    },
    headerButtonConnected: {
      background: colors.invariant.light,
      color: colors.white.main,
      paddingInline: 12,
      borderRadius: 14,
      textTransform: 'none',
      ...typography.body1,
      height: 40,
      transition: '300ms',

      '&:hover': {
        background: colors.blue.deep,
        '@media (hover: none)': {
          background: colors.invariant.light
        }
      },

      '&.Mui-disabled': {
        background: colors.invariant.componentBcg,
        backgroundImage: 'none !important',
        opacity: 0.5,
        pointerEvents: 'auto',
        color: `${colors.invariant.textGrey} !important`,
        '&:hover': {
          background: colors.invariant.componentBcg,
          boxShadow: 'none',
          cursor: 'not-allowed'
        }
      }
    },
    swapChangeWallet: {
      zIndex: 1,
      background: colors.invariant.pinkLinearGradient,
      '&:hover': {
        boxShadow: `0 0 15px ${colors.invariant.light}`,
        backgroundColor: colors.invariant.light,
        '@media (hover: none)': {
          zIndex: 1,
          background: colors.invariant.pinkLinearGradient,
          boxShadow: 'none'
        }
      }
    },
    headerButtonConnect: {
      background: colors.invariant.pinkLinearGradientOpacity,
      color: colors.invariant.newDark,
      paddingInline: 12,
      borderRadius: 14,
      textTransform: 'none',
      ...typography.body1,
      height: 40,
      minWidth: 130,
      transition: '300ms',

      [theme.breakpoints.down('sm')]: {
        minWidth: 100,
        width: 100
      },

      '&:hover': {
        boxShadow: `0 0 15px ${colors.invariant.light}`,
        backgroundColor: colors.invariant.light,
        '@media (hover: none)': {
          background: colors.invariant.pinkLinearGradientOpacity,
          boxShadow: 'none'
        }
      },

      '&.Mui-disabled': {
        background: colors.invariant.componentBcg,
        backgroundImage: 'none !important',
        opacity: 0.5,
        pointerEvents: 'auto',
        color: `${colors.invariant.textGrey} !important`,
        '&:hover': {
          background: colors.invariant.componentBcg,
          boxShadow: 'none',
          cursor: 'not-allowed'
        }
      }
    },
    headerButtonTextEllipsis: {
      textTransform: 'none',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      ...typography.body1,
      whiteSpace: 'nowrap'
    },
    disabled: {
      color: `${colors.invariant.textGrey} !important`,
      cursor: 'not-allowed !important',

      '&:hover': {
        background: 'transparent',
        boxShadow: 'none'
      }
    },
    paper: {
      background: 'transparent',
      boxShadow: 'none'
    },
    startIcon: {
      marginTop: 3
    },
    endIcon: {
      marginBottom: 3
    },
    innerEndIcon: {
      marginLeft: 0,
      marginBottom: 3
    },
    warningIcon: {
      height: 16,
      marginRight: 4
    },
    headerButtonContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: 4
    },
    childrenWrapper: {
      color: colors.invariant.text,
      lineHeight: '12px',
      textAlign: 'left'
    },
    buttonLabel: {
      color: colors.invariant.textGrey,
      ...typography.caption4,
      marginTop: '4px',
      textAlign: 'left'
    }
  }
})

export default useStyles
