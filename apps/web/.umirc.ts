import { defineConfig } from "umi";

export default defineConfig({
  esbuildMinifyIIFE: true,
  plugins: [
    require.resolve('@umijs/plugins/dist/initial-state'),
    require.resolve('@umijs/plugins/dist/model'),
    require.resolve('@umijs/plugins/dist/request'),
  ],
  routes: [
    { path: "/login", component: "login", layout: false },
    { path: "/sign-up", component: "sign-up", layout: false },
    { path: "/", component: "home" },
    { path: "/restaurant", component: "restaurant" },
    { path: "/restaurant-detail/:id", component: "restaurant-detail" },
    {
      path: "/cart",
      component: "cart",
      wrappers: ["@/wrappers/AuthGuard"],
    },
    {
      path: "/checkout",
      component: "checkout",
      layout: false,
      wrappers: ["@/wrappers/AuthGuard"],
    },
    {
      path: "/orders",
      component: "orders",
      wrappers: ["@/wrappers/AuthGuard"],
    },
    {
      path: "/order-detail/:id",
      component: "order-detail",
      wrappers: ["@/wrappers/AuthGuard"],
    },
    { path: "/dashboard", component: "dashboard" },
    { path: "/__preview", component: "__preview", layout: false },
  ],

  request: {},
  initialState: {},
  model: {},

  mock: false,
  proxy: {
    "/api": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
  npmClient: "pnpm",
  extraPostCSSPlugins: [require("tailwindcss"), require("autoprefixer")],
  clickToComponent: { editor: "cursor" },
});
