import { Theme } from '@mui/material'
import { typography, colors } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles<{ isXs: boolean }>()((theme: Theme, { isXs }) => ({
  wrapper: {
    maxWidth: 1210,
    minHeight: '100%'
  },
  subheader: {
    ...typography.heading4,
    color: colors.white.main
  },
  plotsRow: {
    marginBottom: 24,
    flexDirection: 'row',

    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column'
    }
  },
  row: {
    marginBottom: 16
  },
  loading: {
    width: 150,
    height: 150,
    margin: 'auto'
  },

  rowContainer: {
    display: 'flex',
    flexDirection: isXs ? 'column' : 'row',
    alignItems: isXs ? 'flex-start' : 'flex-end',
    justifyContent: 'space-between',
    width: '100%'
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%'
  },

  paper: {
    background: colors.invariant.bodyBackground,
    boxShadow: 'none',
    maxWidth: 500,
    maxHeight: '100vh',
    marginTop: 8,
    '&::-webkit-scrollbar': {
      width: 6,
      background: colors.invariant.component
    },
    '&::-webkit-scrollbar-thumb': {
      background: colors.invariant.light,
      borderRadius: 6
    }
  }
}))

export default useStyles
