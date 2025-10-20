import app from './app';
import config from './config/env';

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
});
