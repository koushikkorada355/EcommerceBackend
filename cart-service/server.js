const app = require('./src/app');
const logger = require('./src/utils/logger');
require('dotenv').config();

const PORT = process.env.PORT || 3004;

app.listen(PORT, () => {
  logger.info(`Cart Service running on port ${PORT}`);
});
