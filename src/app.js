import express from 'express';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import workRoutes from './routes/workRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(cookieParser());

app.use(express.json());

app.use('/api/users', userRoutes);

app.use(errorHandler);

app.use('/works', workRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
