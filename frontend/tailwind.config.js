/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            p: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            h1: {
              fontWeight: '600',
              fontSize: '1.875em',
              marginTop: '0.8em',
              marginBottom: '0.4em',
            },
            h2: {
              fontWeight: '600',
              fontSize: '1.5em',
              marginTop: '0.8em',
              marginBottom: '0.4em',
            },
            ul: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            ol: {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            blockquote: {
              fontStyle: 'normal',
              fontWeight: 'normal',
              color: '#374151',
              borderLeftColor: '#E5E7EB',
              borderLeftWidth: '0.25rem',
              paddingLeft: '1rem',
              margin: '0.5em 0',
            },
            'ul > li': {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            'ol > li': {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}