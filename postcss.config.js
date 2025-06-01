export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'Firefox ESR',
        'not dead',
        'not IE 9-10',
        'IE 11'
      ],
      grid: 'autoplace',
      flexbox: 'no-2009'
    },
  },
};
