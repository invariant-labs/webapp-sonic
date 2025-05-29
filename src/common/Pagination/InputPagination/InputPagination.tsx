import { Box, Pagination, Typography, useMediaQuery } from '@mui/material'
import { useStyles } from './style'
import { useEffect, useLayoutEffect, useState } from 'react'
import { theme } from '@static/theme'

export interface IPaginationList {
  pages: number
  defaultPage: number
  handleChangePage: (page: number) => void
  variant: string
  squeeze?: boolean
  page?: number
  borderTop?: boolean
  pagesNumeration?: {
    lowerBound: number
    totalItems: number
    upperBound: number
  }
  activeInput?: boolean
}

export const InputPagination: React.FC<IPaginationList> = ({
  pages,
  defaultPage,
  handleChangePage,
  borderTop = false,
  squeeze = false,
  pagesNumeration,
  variant,
  activeInput = true
}) => {
  const isSm = useMediaQuery(theme.breakpoints.down('sm'))
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  const matches = useMediaQuery(theme.breakpoints.down('lg'))

  const { classes } = useStyles({ borderTop, isMobile })
  const [currentPage, setCurrentPage] = useState<number | string>(defaultPage)

  const [inputValue, setInputValue] = useState<string>(defaultPage.toString())
  const [inputWidth, setInputWidth] = useState<number | string>(0)

  const changePageImmediate = (value: string) => {
    const num = parseInt(value)
    console.log(num)
    console.log(isNaN(num))

    if (isNaN(num)) {
      console.log('test')
      setCurrentPage(1)
      handleChangePage(1)
      return
    }

    if (num < 1) {
      setCurrentPage(1)
      handleChangePage(1)
      return
    }

    if (num > pages) {
      setCurrentPage(pages)
      handleChangePage(pages)
      return
    }

    setCurrentPage(num)
    handleChangePage(num)
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      changePageImmediate(inputValue)
    }, 500)

    return () => clearTimeout(timeout)
  }, [inputValue])

  useLayoutEffect(() => {
    if (inputValue) {
      setInputWidth(inputValue.length * 12 + 16)
    } else {
      setInputWidth(1 * 12 + 16)
    }
  }, [inputValue])

  useEffect(() => {
    if (defaultPage) {
      setCurrentPage(defaultPage)
      setInputValue(defaultPage.toString())
      handleChangePage(defaultPage)
    }
  }, [pages])

  return (
    <>
      <Box className={classes.pagination}>
        {!isMobile && activeInput && (
          <Box
            display='flex'
            alignItems='center'
            justifyContent={isMobile ? 'center' : 'flex-start'}
            gap={1}
            width={240}>
            <Typography className={classes.labelText}> Go to</Typography>
            <input
              className={classes.input}
              style={{ width: inputWidth }}
              value={inputValue}
              onChange={e => {
                const value = e.target.value

                if (value === '') {
                  setInputValue('')
                  return
                }

                if (!/^\d+$/.test(value)) {
                  return
                }

                const numericValue = Number(value)

                if (numericValue > pages) {
                  setInputValue(String(pages))
                  return
                }

                setInputValue(value)
              }}
              type='text'
              inputMode='numeric'
              onBlur={() => {
                if (inputValue === '') {
                  setInputValue('1')
                }
              }}
            />

            <Typography className={classes.labelText}> page</Typography>
          </Box>
        )}
        <Pagination
          style={{
            justifyContent: isSm ? 'center' : `${variant}`
          }}
          className={classes.root}
          count={pages}
          shape='rounded'
          siblingCount={squeeze ? 0 : matches ? 0 : 1}
          page={typeof currentPage === 'number' ? currentPage : 1}
          onChange={(_e, newPage) => {
            setCurrentPage(newPage)
            setInputValue(newPage.toString())
            handleChangePage(newPage)
          }}
        />
        {isMobile && activeInput && (
          <Box
            display='flex'
            alignItems='center'
            justifyContent={isMobile ? 'center' : 'flex-start'}
            gap={1}
            width={240}>
            <Typography className={classes.labelText}> Go to</Typography>
            <input
              className={classes.input}
              style={{ width: inputWidth }}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              type='number'
            />
            <Typography className={classes.labelText}> page</Typography>
          </Box>
        )}
        {pagesNumeration ? (
          <Typography className={classes.labelText} width={240}>
            Showing {pagesNumeration.lowerBound}-{pagesNumeration.upperBound} of{' '}
            {pagesNumeration.totalItems}
          </Typography>
        ) : (
          <Box width={240} />
        )}
      </Box>
    </>
  )
}
