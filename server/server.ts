import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { requireAuth } from './src/middleware/requireAuth.ts';
import {channelurl} from './src/routes/channelurl.ts';
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/youtube/url',channelurl)
app.get('/', (req: Request, res: Response) => {
  res.send('Server is running');
});

app.get('/api/me', requireAuth, (req, res) => res.json({ userId: req.userId }))
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});