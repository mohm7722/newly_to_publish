// PM2 process configuration for the Medusa backend.
//
// The backend is started via run-server.sh, which enters the compiled
// ".medusa/server" directory (required for the admin build to be found)
// and copies the backend .env into it before running `medusa start`.
module.exports = {
  apps: [
    {
      name: "medusa-backend",
      script: "./apps/backend/run-server.sh",
      interpreter: "bash",
      cwd: "/www/wwwroot/newly",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 5000,
      autorestart: true,
    },
    {
      name: "storefront",
      script: "npm",
      args: "run start",
      interpreter: "none",
      cwd: "/www/wwwroot/newly/apps/storefront",
      env: {
        NODE_ENV: "production",
      },
      max_restarts: 10,
      restart_delay: 5000,
      autorestart: true,
    },
  ],
}
