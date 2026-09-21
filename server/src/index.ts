import http from 'http';
import { app, logger } from './app.js';
import { config } from './config.js';
import { setupWebSocketServer } from './ws/server.js';

const server = http.createServer(app);
setupWebSocketServer(server);

server.listen(config.PORT, () => {
  logger.info(
    {
      port: config.PORT,
      env: config.NODE_ENV,
      healthCheck: `http://localhost:${config.PORT}/api/health`,
    },
    'InterviewShield Server started successfully'
  );
});

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down server gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
