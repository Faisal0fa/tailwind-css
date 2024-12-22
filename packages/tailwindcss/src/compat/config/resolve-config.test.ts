import { expect, test } from 'vitest'
import { buildDesignSystem } from '../../design-system'
import { Theme } from '../../theme'
import { resolveConfig } from './resolve-config'

test('top level theme keys are replaced', () => {
  let design = buildDesignSystem(new Theme())

  let { resolvedConfig, replacedThemeKeys } = resolveConfig(design, [
    {
      config: {
        theme: {
          colors: {
            red: 'red',
          },

          fontFamily: {
            sans: 'SF Pro Display',
          },
        },
      },
      base: '/root',
    },
    {
      config: {
        theme: {
          colors: {
            green: 'green',
          },
        },
      },
      base: '/root',
    },
    {
      config: {
        theme: {
          colors: {
            blue: 'blue',
          },
        },
      },
      base: '/root',
    },
  ])

  expect(resolvedConfig).toMatchObject({
    theme: {
      colors: {
        blue: 'blue',
      },
      fontFamily: {
        sans: 'SF Pro Display',
      },
    },
  })
  expect(replacedThemeKeys).toEqual(new Set(['colors', 'fontFamily']))
})

test('theme can be extended', () => {
  let design = buildDesignSystem(new Theme())

  let { resolvedConfig, replacedThemeKeys } = resolveConfig(design, [
    {
      config: {
        theme: {
          colors: {
            red: 'red',
          },

          fontFamily: {
            sans: 'SF Pro Display',
          },
        },
      },
      base: '/root',
    },
    {
      config: {
        theme: {
          extend: {
            colors: {
              blue: 'blue',
            },
          },
        },
      },
      base: '/root',
    },
  ])

  expect(resolvedConfig).toMatchObject({
    theme: {
      colors: {
        red: 'red',
        blue: 'blue',
      },
      fontFamily: {
        sans: 'SF Pro Display',
      },
    },
  })
  expect(replacedThemeKeys).toEqual(new Set(['colors', 'fontFamily']))
})

test('theme keys can reference other theme keys using the theme function regardless of order', ({
  expect,
}) => {
  let design = buildDesignSystem(new Theme())

  let { resolvedConfig, replacedThemeKeys } = resolveConfig(design, [
    {
      config: {
        theme: {
          colors: {
            red: 'red',
          },
          placeholderColor: {
            green: 'green',
          },
        },
      },
      base: '/root',
    },
    {
      config: {
        theme: {
          extend: {
            colors: ({ theme }) => ({
              ...theme('placeholderColor'),
              blue: 'blue',
            }),
          },
        },
      },
      base: '/root',
    },
    {
      config: {
        theme: {
          extend: {
            caretColor: ({ theme }) => theme('accentColor'),
            accentColor: ({ theme }) => theme('backgroundColor'),
            backgroundColor: ({ theme }) => theme('colors'),
          },
        },
      },
      base: '/root',
    },
  ])

  expect(resolvedConfig).toMatchObject({
    theme: {
      colors: {
        red: 'red',
        green: 'green',
        blue: 'blue',
      },
      accentColor: {
        red: 'red',
        green: 'green',
        blue: 'blue',
      },
      backgroundColor: {
        red: 'red',
        green: 'green',
        blue: 'blue',
      },
      caretColor: {
        red: 'red',
        green: 'green',
        blue: 'blue',
      },
    },
  })
  expect(replacedThemeKeys).toEqual(new Set(['colors', 'placeholderColor']))
})

test('theme keys can read from the CSS theme', () => {
  let theme = new Theme()
  theme.add('--color-green', 'green')

  let design = buildDesignSystem(theme)

  let { resolvedConfig, replacedThemeKeys } = resolveConfig(design, [
    {
      config: {
        theme: {
          colors: ({ theme }) => ({
            // Reads from the --color-* namespace
            ...theme('color'),
            red: 'red',
          }),
          accentColor: ({ theme }) => ({
            // Reads from the --color-* namespace through `colors`
            ...theme('colors'),
          }),
          placeholderColor: ({ theme }) => ({
            // Reads from the --color-* namespace through `colors`
            primary: theme('colors.green'),

            // Reads from the --color-* namespace directly
            secondary: theme('color.green'),
          }),
          caretColor: ({ colors }) => ({
            // Gives access to the colors object directly
            primary: colors.green,
          }),
          transitionColor: (theme: any) => ({
            // The parameter object is also the theme function
            ...theme('colors'),
          }),
        },
      },
      base: '/root',
    },
  ])

  expect(resolvedConfig).toMatchObject({
    theme: {
      colors: {
        red: 'red',
        green: 'green',
      },
      accentColor: {
        red: 'red',
        green: 'green',
      },
      placeholderColor: {
        primary: 'green',
        secondary: 'green',
      },
      caretColor: {
        primary: {
          '50': 'oklch(0.982 0.018 155.826)',
          '100': 'oklch(0.962 0.044 156.743)',
          '200': 'oklch(0.925 0.084 155.995)',
          '300': 'oklch(0.871 0.15 154.449)',
          '400': 'oklch(0.792 0.209 151.711)',
          '500': 'oklch(0.723 0.219 149.579)',
          '600': 'oklch(0.627 0.194 149.214)',
          '700': 'oklch(0.527 0.154 150.069)',
          '800': 'oklch(0.448 0.119 151.328)',
          '900': 'oklch(0.393 0.095 152.535)',
          '950': 'oklch(0.266 0.065 152.934)',
        },
      },
      transitionColor: {
        red: 'red',
        green: 'green',
      },
    },
  })
  expect(replacedThemeKeys).toEqual(
    new Set(['colors', 'accentColor', 'placeholderColor', 'caretColor', 'transitionColor']),
  )
})