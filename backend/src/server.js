
const app = require('./app');
const { verifyMailerOnBoot } = require('./utils/mailer');

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`MechVerse running on http://localhost:${PORT}`));
verifyMailerOnBoot();
