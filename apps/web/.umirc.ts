import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/login", component: "login", layout: false },
    { path: "/sign-up", component: "sign-up", layout: false },
    { path: "/", component: "home" },
    { path: "/restaurant", component: "restaurant" },
    { path: "/restaurant-detail/:id", component: "restaurant-detail" },
    { path: "/cart", component: "cart" },
    { path: "/checkout", component: "checkout", layout: false },
    { path: "/orders", component: "orders" },
    { path: "/order-detail/:id", component: "order-detail" },
    { path: "/dashboard", component: "dashboard" },
    { path: "/__preview", component: "__preview", layout: false },
  ],

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
