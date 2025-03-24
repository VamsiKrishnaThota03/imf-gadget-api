const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const { sequelize } = require('./src/models');
const gadgetRoutes = require('./src/routes/gadgetRoutes');
const authRoutes = require('./src/routes/authRoutes');
require('dotenv').config();

const app = express();

// CORS configuration
app.use(cors());
app.options('*', cors());

app.use(express.json());

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true
  }
}));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/gadgets', gadgetRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
  });
}); 