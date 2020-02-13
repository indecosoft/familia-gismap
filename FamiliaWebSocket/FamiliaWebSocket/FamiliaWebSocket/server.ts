import { server } from './App/App';

const port = process.env.PORT || 3000;

server.listen(port, error => error ? console.error(error) : console.log(`Listen on ${port} port!`));

process.chdir(__dirname);