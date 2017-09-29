const PORT = 4000;
const DELAY = 500;

const faker = require('faker');
const range = require('lodash/range');
const jsonServer = require('json-server')

const server = jsonServer.create()
const middlewares = jsonServer.defaults()

const fakeData = () => {
  const songs = range(30).map((i) => ({
    id: i + 1,
    title: faker.name.findName(),
    author: faker.name.findName(),
    image: `/images/${i % 9 + 1}.jpg`
  }))

  return { songs };
};

const router = jsonServer.router(fakeData());

// add a bit of delay;
server.use((req, res, next) => setTimeout(next, DELAY));

server.use(middlewares)
server.use(router)
server.listen(PORT, () => {
  console.log('JSON Server is running on port', PORT)
});
