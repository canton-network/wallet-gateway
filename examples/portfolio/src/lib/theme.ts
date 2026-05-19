// Copyright (c) 2025-2026 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import { createTheme, type ThemeOptions } from '@mui/material/styles'

export const portfolioColors = {
    black: '#000000',
    grey27: '#1B1B1B',
    grey36: '#272727',
    grey54: '#363636',
    grey69: '#454545',
    grey105: '#696969',
    grey207: '#CFCFCF',
    grey226: '#E2E2E2',
    white: '#FFFFFF',
    lightBlue99: '#96E4FD',
    lightBlue89: '#C8F1FE',
    yellow100: '#F3FF97',
    yellow99: '#F8FDCD',
    purple100: '#875CFF',
    purple90: '#561AFF',
    purple30: '#C6B2FF',
    red99: '#FD8575',
    green76: '#33C200',
} as const

declare module '@mui/material/styles' {
    interface Theme {
        portfolio: {
            sidebar: { background: string; active: string }
            surface: { subtle: string; border: string; required: string }
            nav: { main: string; hover: string; soft: string }
        }
    }

    interface ThemeOptions {
        portfolio?: Partial<Theme['portfolio']>
    }
}

export const portfolioAppTokens = {
    portfolio: {
        sidebar: {
            background: portfolioColors.grey36,
            active: portfolioColors.grey54,
        },
        surface: {
            subtle: portfolioColors.grey36,
            border: portfolioColors.grey69,
            required: portfolioColors.grey54,
        },
        nav: {
            main: portfolioColors.purple100,
            hover: portfolioColors.purple90,
            soft: portfolioColors.purple30,
        },
    },
} satisfies ThemeOptions

const typography = {
    fontFamily: 'Inter, sans-serif',
}

export const darkPortfolioTokens: ThemeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: portfolioColors.lightBlue99,
            light: portfolioColors.lightBlue89,
            contrastText: portfolioColors.black,
        },
        secondary: {
            main: portfolioColors.yellow100,
            light: portfolioColors.yellow99,
            contrastText: portfolioColors.black,
        },
        error: {
            main: portfolioColors.red99,
            contrastText: portfolioColors.black,
        },
        warning: {
            main: portfolioColors.red99,
            contrastText: portfolioColors.black,
        },
        success: {
            main: portfolioColors.green76,
            contrastText: portfolioColors.black,
        },
        background: {
            default: portfolioColors.grey27,
            paper: portfolioColors.grey36,
        },
        text: {
            primary: portfolioColors.grey226,
            secondary: portfolioColors.grey207,
            disabled: portfolioColors.grey105,
        },
        divider: portfolioColors.grey69,
        action: {
            hover: portfolioColors.grey54,
            selected: portfolioColors.grey54,
            disabled: portfolioColors.grey105,
            disabledBackground: portfolioColors.grey54,
        },
    },
    typography,
    ...portfolioAppTokens,
}

export const lightPortfolioTokens: ThemeOptions = {
    palette: {
        mode: 'light',
        primary: {
            main: portfolioColors.purple90,
            light: portfolioColors.purple100,
            contrastText: portfolioColors.white,
        },
        secondary: {
            main: portfolioColors.grey54,
            light: portfolioColors.grey69,
            contrastText: portfolioColors.white,
        },
        error: {
            main: portfolioColors.red99,
            contrastText: portfolioColors.black,
        },
        warning: {
            main: portfolioColors.red99,
            contrastText: portfolioColors.black,
        },
        success: {
            main: portfolioColors.green76,
            contrastText: portfolioColors.black,
        },
        background: {
            default: portfolioColors.white,
            paper: portfolioColors.grey226,
        },
        text: {
            primary: portfolioColors.black,
            secondary: portfolioColors.grey54,
            disabled: portfolioColors.grey105,
        },
        divider: portfolioColors.grey207,
        action: {
            hover: portfolioColors.grey226,
            selected: portfolioColors.grey207,
            disabled: portfolioColors.grey105,
            disabledBackground: portfolioColors.grey207,
        },
    },
    typography,
    portfolio: {
        sidebar: {
            background: portfolioColors.grey226,
            active: portfolioColors.grey207,
        },
        surface: {
            subtle: portfolioColors.white,
            border: portfolioColors.grey207,
            required: portfolioColors.grey226,
        },
        nav: portfolioAppTokens.portfolio.nav,
    },
}

export const portfolioComponents: ThemeOptions['components'] = {
    MuiCssBaseline: {
        styleOverrides: (theme) => ({
            body: {
                backgroundColor: theme.palette.background.default,
                color: theme.palette.text.primary,
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
            },
            '::selection': {
                backgroundColor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
            },
        }),
    },
    MuiButton: {
        defaultProps: {
            disableElevation: true,
        },
        styleOverrides: {
            root: ({ theme }) => ({
                minWidth: 'unset',
                textTransform: 'none',
                '&.Mui-focusVisible': {
                    outline: `2px solid ${theme.palette.secondary.main}`,
                    outlineOffset: 2,
                },
                '&.MuiButton-containedPrimary': {
                    color: theme.palette.primary.contrastText,
                    backgroundColor: theme.palette.primary.main,
                    '&:hover': { backgroundColor: theme.palette.primary.light },
                },
                '&.MuiButton-containedSecondary': {
                    color: theme.palette.secondary.contrastText,
                    backgroundColor: theme.palette.secondary.main,
                    '&:hover': {
                        backgroundColor: theme.palette.secondary.light,
                    },
                },
                '&.MuiButton-outlinedError': {
                    color: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                    '&:hover': {
                        borderColor: theme.palette.error.main,
                        backgroundColor: 'rgba(253, 133, 117, 0.08)',
                    },
                },
            }),
        },
    },
}

export const darkTheme = createTheme({
    ...darkPortfolioTokens,
    components: portfolioComponents,
})

export const lightTheme = createTheme({
    ...lightPortfolioTokens,
    components: portfolioComponents,
})

export default darkTheme
