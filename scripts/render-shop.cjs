// Render the actual React shop at build time. No runtime API or headless browser.
const path = require("node:path");
const Module = require("node:module");
const babel = require("@babel/core");
const React = require("react");
const { renderToString } = require("react-dom/server");
const { StaticRouter } = require("react-router-dom/server");
const sourceRoot = path.resolve(__dirname, "../src") + path.sep;
module.exports = function renderShop() {
  const originalJS = Module._extensions[".js"];
  const originalJSX = Module._extensions[".jsx"];
  function compile(module, filename) {
    if (!filename.startsWith(sourceRoot)) return originalJS(module, filename);
    const { code } = babel.transformFileSync(filename, {
      babelrc: false,
      configFile: false,
      presets: [
        [
          require.resolve("@babel/preset-env"),
          { targets: { node: "current" }, modules: "commonjs" },
        ],
        [require.resolve("@babel/preset-react"), { runtime: "automatic" }],
      ],
    });
    module._compile(code, filename);
  }
  Module._extensions[".js"] = compile;
  Module._extensions[".jsx"] = compile;
  try {
    const SiteLayout = require("../src/components/SiteLayout.jsx").default;
    const Shop = require("../src/pages/Shop.jsx").default;
    return renderToString(
      React.createElement(
        StaticRouter,
        { location: "/shop" },
        React.createElement(SiteLayout, null, React.createElement(Shop)),
      ),
    );
  } finally {
    Module._extensions[".js"] = originalJS;
    if (originalJSX) Module._extensions[".jsx"] = originalJSX;
    else delete Module._extensions[".jsx"];
  }
};
