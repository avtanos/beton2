const express = require('express');
const cors = require('cors');
const path = require('path');

const ordersRouter = require('./routes/orders');
const clientsRouter = require('./routes/clients');
const weighingsRouter = require('./routes/weighings');
const productionRouter = require('./routes/production');
const warehouseRouter = require('./routes/warehouse');
const logisticsRouter = require('./routes/logistics');
const maintenanceRouter = require('./routes/maintenance');
const qualityRouter = require('./routes/quality');
const analyticsRouter = require('./routes/analytics');
const auditRouter = require('./routes/audit');
const searchRouter = require('./routes/search');
const eventsRouter = require('./routes/events');
const recipesRouter = require('./routes/recipes');
const repairRequestsRouter = require('./routes/repair-requests');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/orders', ordersRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/weighings', weighingsRouter);
app.use('/api/production', productionRouter);
app.use('/api/warehouse', warehouseRouter);
app.use('/api/logistics', logisticsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/quality', qualityRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/audit', auditRouter);
app.use('/api/search', searchRouter);
app.use('/api/events', eventsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/repair-requests', repairRequestsRouter);

// Serve React app in production
const buildPath = path.join(__dirname, '../client/build');
if (require('fs').existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`EIS Server running on http://localhost:${PORT}`);
});
