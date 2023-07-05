const express = require('express');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { StaticRouter } = require('react-router');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./config.js');
const routes = require('./src/routes.jsx');
const alt = require('./src/alt');
const posts = require('./routes/post.routes');

const app = express();
const port = config.port;

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'copy cat', resave: false, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cookieParser());

// Use routes here
app.use('/', posts);

app.use((req, res) => {
  const context = {};

  const content = ReactDOMServer.renderToString(
    <StaticRouter location={req.url} context={context}>
      {routes}
    </StaticRouter>
  );

  const data = res.locals.data || {};
  alt.bootstrap(JSON.stringify(data));

  const metaDescription = res.locals.metaDescription || '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${config.pageTitle}</title>
        <meta name="description" content="${metaDescription}">
      </head>
      <body>
        <div id="root">${content}</div>
        <script>window.__ALT_DATA__ = ${JSON.stringify(alt.flush())};</script>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `;

  if (context.url) {
    res.writeHead(301, {
      Location: context.url
    });
    res.end();
  } else {
    res.send(html);
  }
});

// Production error handler
// No stacktraces leaked to the user
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  console.error(err);

  res.status(statusCode).sendFile(path.resolve(__dirname, `views/error/${statusCode}.html`));
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
