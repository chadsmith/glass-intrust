# INTRUST Bank for Google Glass

View your INTRUST Bank account balances on Google Glass.

##Prerequisites

* Google Glass w/ access to Mirror API
* Node.js, NPM
* [INTRUST Bank](https://www.intrustbank.com/)

## Installation

`npm install` or `npm install express googleapis zombie`

## Configuration

* Create a new [Google APIs Project](https://code.google.com/apis/console)
* Enable the Google Mirror API
* Create an OAuth 2.0 client ID for a web application
* Enter your server's hostname and port in [app.js](https://github.com/chadsmith/glass-intrust/blob/master/app.js#L7-10)
* Enter your Mirror API credentials in [app.js](https://github.com/chadsmith/glass-intrust/blob/master/app.js#L11-14)
* Enter your INTRUST Bank credentials in [app.js](https://github.com/chadsmith/glass-intrust/blob/master/app.js#L15-18)

## Usage

`node app` or `forever start app.js`

* Authorize the app by visiting http://hostname:port/ on your computer
* View your account balance in your Glass timeline
