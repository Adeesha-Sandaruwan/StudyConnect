import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';

dotenv.config();

connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use('/api/users', authRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(port, () => console.log(`Server started on port ${port}`));