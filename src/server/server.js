require('dotenv').config();

const Hapi = require('@hapi/hapi');
const routes = require('../server/routes');
const loadModel = require('../services/loadModel');
const InputError = require('../exceptions/InputError');

(async () => {
  const server = Hapi.server({
    port: 3000,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  const model = await loadModel();
  server.app.model = model;

  server.route(routes); // Akan dibahas lebih lanjut setelah pembahasan extension.
  server.ext('onPreResponse', function (request, h) {
    const response = request.response;
    // jika response-nya adalah Input Error atau terjadi kesalahan input
    if (response instanceof InputError) {
      const newResponse = h.response({
        status: 'fail',
        message: `${response.message} Silakan gunakan foto lain.`,
      });
      newResponse.code(response.statusCode);
      return newResponse;
    }
    // membatasi pengguna untuk mengunggah gambar maksimal berukuran 1 MB
    if (response.isBoom) {
      const newResponse = h.response({
        status: 'fail',
        message: response.message,
      });
      newResponse.code(response.output.statusCode);
      return newResponse;
    }
    // untuk melanjutkan proses server tanpa mengubah response apa pun jika tidak terjadi error
    return h.continue;
  });

  await server.start();
  console.log(`Server start at: ${server.info.uri}`);
})();
