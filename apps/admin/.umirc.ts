import { defineConfig } from "umi";

export default defineConfig({
  plugins: [
    '@umijs/plugins/dist/initial-state',
    '@umijs/plugins/dist/model',
    '@umijs/plugins/dist/access',
  ],
  model: {},
  initialState: {},
  access: {},
  routes: [
    { path: "/login", component: "login", layout: false },
    { path: "/", component: "dashboard" },
    { path: "/restaurants", component: "restaurants" },
    { path: "/orders", component: "orders" },
    { path: "/users", component: "users", access: "canManageUsers" },
    { path: "/permissions", component: "permissions", access: "canManagePermissions" },
    { path: "/schemas", component: "schemas", access: "canManageSchemas" },
  ],

  define: {
    WEB_APP_URL_CONST: process.env.WEB_APP_URL || "http://localhost:8000",
  },

  mock: {
    include: ["src/mock/**/*.ts"],
  },
  proxy: {
    "/api/auth": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
    "/api/admin": {
      target: "http://localhost:8080",
      changeOrigin: true,
    },
  },
  npmClient: "pnpm",
  extraPostCSSPlugins: [require("tailwindcss"), require("autoprefixer")],
  clickToComponent: { editor: "cursor" },
});
