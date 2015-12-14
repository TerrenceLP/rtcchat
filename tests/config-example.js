module.exports = {
  key: {
    id: '<%= YOUR APP KEY HERE %>',
    secret: '<%= YOUR APP KEY SECRET HERE %>'
  },
  browsers: {

  }
  IEWebDriverHost: '<%= SELENIUM WEB HOST IP HERE %>',
};

module.exports = {
  key: {
    id: '<%= YOUR APP KEY HERE %>',
    secret: '<%= YOUR APP KEY SECRET HERE %>'
  },
  run: {
    // available: IE / safari / chrome / firefox / opera / webdriver (For IE and configure webDriver)
    // remove or add based on availability
    browsers: ['IE', 'safari', 'chrome', 'firefox', 'opera', 'webdriver'],
    // uses selenium IEDriver with Selenium java
    webDriver: {
      host: '<%= SELENIUM WEB HOST IP HERE %>',
      port: '<%= SELENIUM WEB HOST PORT HERE %>'
    }
  }
};