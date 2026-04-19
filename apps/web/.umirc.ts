import { defineConfig } from "umi";

export default defineConfig({
  routes: [
    { path: "/login", component: "login", layout: false },
    { path: "/sign-up", component: "sign-up", layout: false },
    { path: "/", component: "home" },
    { path: "/restaurant", component: "restaurant" },
    { path: "/dashboard", component: "dashboard" },
    { path: "/__preview", component: "__preview", layout: false },
  ],

  mock: {
    include: ["src/mock/**/*.ts"],
  },
  proxy: {
    "/api/auth": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
    "/api/public": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
  npmClient: "pnpm",
  extraPostCSSPlugins: [require("tailwindcss"), require("autoprefixer")],
  clickToComponent: { editor: "cursor" },
});
