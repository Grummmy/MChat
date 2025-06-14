const mc = require('minecraft-protocol');

const proxy = mc.createServer({
  'online-mode': false,
  port: 25565,
  version: '1.16.5',
  keepAlive: true
});
// console.log(mc.states)
proxy.on('login', (client) => {
  console.log(`${client.username} connected`);

  const serverClient = mc.createClient({
    host: 'vilgelmrp.ru',
    port: 25565,
    username: client.username,
    version: '1.16.5',
    'online-mode': false,
    keepAlive: true,
  });

  client.on('packet', (data, meta) => {
    if (client.state === mc.states.PLAY && serverClient.state === mc.states.PLAY
        || client.state === mc.states.CONFIGURATION && serverClient.state === mc.states.CONFIGURATION
    ) {
      console.log(`[C -> S] ${meta.name}`)
      try {
        serverClient.write(meta.name, data);
      } catch (e) {
        console.error(`Ошибка при отправке клиент → сервер (${meta.name})`, e);
      }
    }
  });

  serverClient.on('packet', (data, meta) => {
    if (client.state === mc.states.PLAY && serverClient.state === mc.states.PLAY
        || client.state === mc.states.CONFIGURATION && serverClient.state === mc.states.CONFIGURATION
    ) {
      console.log(`[S -> C] ${meta.name}`)
      try {
        client.write(meta.name, data);
      } catch (e) {
        console.error(`Ошибка при отправке сервер → клиент (${meta.name})`, e);
      }
    }
  });

  serverClient.on('kick_disconnect', (packet) => {
    console.log('[КИК ОТ СЕРВЕРА]', packet);
  });

  serverClient.on('error', err => console.error('Ошибка сервера:', err));
  client.on('error', err => console.error('Ошибка клиента:', err));
  serverClient.on('end', () => console.log('Сервер закрыл соединение'));
  client.on('end', () => console.log('Клиент отключился'));
});