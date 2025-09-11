// craco.config.js
module.exports = {
  webpack: {
    configure: webpackConfig => {
      // 1) Silence those missing react-is source map warnings
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
        /ENOENT.*react-is/,
      ];

      // 2) If source-map-loader is present, exclude node_modules (or just the bad paths)
      const rules = webpackConfig.module?.rules || [];
      rules.forEach(rule => {
        if (rule && Array.isArray(rule.oneOf)) {
          rule.oneOf.forEach(r => {
            if (r && r.enforce === 'pre' && r.use) {
              const uses = Array.isArray(r.use) ? r.use : [r.use];
              const hasSourceMapLoader = uses.some(
                u =>
                  (typeof u === 'string' && u.includes('source-map-loader')) ||
                  (u && u.loader && u.loader.includes('source-map-loader'))
              );
              if (hasSourceMapLoader) {
                // exclude all node_modules to avoid ENOENT in nested react-is
                r.exclude = /node_modules/;
                // or to be narrower:
                // r.exclude = [
                //   /node_modules\/react-router\/node_modules\/react-is/,
                //   /node_modules\/hoist-non-react-statics\/node_modules\/react-is/,
                // ];
              }
            }
          });
        }
      });

      return webpackConfig;
    },
  },
};
