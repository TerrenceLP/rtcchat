/**
 * Running test configuration
 */
module.exports = {
  key: {
    id: '<%= YOUR APP KEY HERE %>',
    secret: '<%= YOUR APP KEY SECRET HERE %>'
  },
  run: {
    // your host IP
    host: '<%= YOUR HOST IP HERE %>',
    // available: IE / safari / chrome / firefox / opera (dropped support) / webdriver (For IE and configure webDriver)
    // remove or add based on availability
    browsers: ['IE', 'safari', 'chrome', 'firefox', 'webdriver'],
    // uses selenium IEDriver with Selenium java
    webDriver: {
      host: '<%= SELENIUM WEB HOST IP HERE %>',
      port: '<%= SELENIUM WEB HOST PORT HERE %>'
    },
    // certificates in (/certificates) folder
    // generate at here: http://www.selfsignedcertificate.com/
    // Dropped support temporarily
    /*certificates: {
      key: '<%= CERTIFICATE KEY HERE %>',
      crt: '<%= CERTIFICATE CRT HERE %>'
    }*/
  }
};