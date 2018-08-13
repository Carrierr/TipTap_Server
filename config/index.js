/**
 * Dependencies
 */

const path = require('path');
const development = require('./env/development');
const production = require('./env/production');
const ec2 = require('./env/ec2');

const defaults = {
    root: path.join(__dirname, '..')
}

module.exports = {
    development: Object.assign({}, development, defaults),
    production: Object.assign({}, production, defaults),
    ec2: Object.assign({}, ec2, defaults),
}[process.env.NODE_ENV || 'development']
