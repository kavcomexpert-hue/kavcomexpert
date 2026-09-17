module.exports = {
  apps: [
    {
      name: "kavcom-site",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // Bind address only — public URLs must use NEXT_PUBLIC_SITE_URL.
        HOSTNAME: "0.0.0.0",
        // Next + Sharp + Data Cache need headroom; 896 caused restart storms → 503s.
        // Host must have ≥2GB RAM available to the Node process.
        NODE_OPTIONS: "--max-old-space-size=1536",
      },
      // Prefer host-level env (Hostinger panel / systemd) over hardcoding secrets here.
      max_memory_restart: "1792M",
      min_uptime: "10s",
      max_restarts: 15,
      kill_timeout: 5000,
      time: true,
    },
  ],
};
