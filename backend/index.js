const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const verifyToken = require('./middleware/authMiddleware');

const app = express();
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const nlpRoutes = require('./routes/nlpRoutes');
const aiRoutes = require('./routes/aiRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const researchPresentationRoutes = require('./routes/researchPresentationRoutes');
const publicationRoutes = require("./routes/publicationRoutes");



// Allow your Netlify frontend
app.use(cors({
  origin: "https://sdgclassification.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/nlp', nlpRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/download', downloadRoutes);
app.use("/api/research-presentation", researchPresentationRoutes);
app.use("/api/publication", publicationRoutes);



app.get('/api/ping', verifyToken, (req, res) => {
  res.json({ message: 'pong' });
});


app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


app.listen(process.env.PORT, () => {
  console.log(`Server running`);
});
