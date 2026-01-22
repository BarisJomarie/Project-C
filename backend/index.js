const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const verifyToken = require('./middleware/authMiddleware');

const app = express();
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const nlpRoutes = require('./routes/nlpRoutes');
const aiRoutes = require('./routes/aiRoutes');
const downloadRoutes = require('./routes/downloadRoutes');



// Allow your Netlify frontend (if production) and localhost (if development) to access the backend
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ccsresearch.netlify.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(cors());


app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/nlp', nlpRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/download', downloadRoutes);



app.get('/api/ping', verifyToken, (req, res) => {
  res.json({ message: 'pong' });
});


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Multer / general error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer-specific errors (like file too large)
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Custom errors (like invalid file type)
    return res.status(400).json({ message: err.message });
  }
  next();
});



app.listen(process.env.PORT, () => {
  console.log(`Server running on PORT: ${process.env.PORT}`);
});
