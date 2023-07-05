const port = process.env.PORT || 5000;
let baseUrl = '';

if (typeof window !== 'undefined') {
  baseUrl = window.location.origin;
} else {
  baseUrl = `http://0.0.0.0:${port}`;
}

const config = {
  port: port,
  baseUrl: baseUrl,
  pageTitle: 'React Blog',
  itemsPerPage: 5,
  maxPageButtons: 3,
  googleAnalyticsId: ''
};

module.exports = config;
