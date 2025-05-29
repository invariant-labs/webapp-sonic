import { typography, colors } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(theme => {
  return {
    container: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      alignItems: 'flex-start',
      backgroundColor: 'transparent',
      paddingInline: 94,
      minHeight: '60vh',

      [theme.breakpoints.down('lg')]: {
        paddingInline: 40
      },

      [theme.breakpoints.down('sm')]: {
        paddingInline: 8
      }
    },

    button: {
      height: 40,
      width: 200,
      marginTop: 20,
      color: colors.invariant.componentBcg,
      ...typography.body1,
      textTransform: 'none',
      borderRadius: 14,
      background: colors.invariant.pinkLinearGradientOpacity,

      '&:hover': {
        background: colors.invariant.pinkLinearGradient,
        boxShadow: '0px 0px 16px rgba(239, 132, 245, 0.35)',
        '@media (hover: none)': {
          background: colors.invariant.pinkLinearGradientOpacity,
          boxShadow: 'none'
        }
      }
    },
    innerContainer: {
      maxWidth: 1210,
      minHeight: '70vh',
      display: 'flex',
      justifyContent: 'center',

      [theme.breakpoints.down('md')]: {
        width: '100%'
      }
    },
    changeWalletButtonContainer: {
      marginTop: 16
    }
  }
})

export default useStyles
