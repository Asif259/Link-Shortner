/**
 * Hostinger Node.js Entry Point
 *
 * Hostinger Node.js App Manager (Phusion Passenger / cPanel / hPanel)
 * launches the application using a root JavaScript file (e.g. server.js).
 * This wrapper loads the compiled NestJS main bundle from dist/main.js.
 */
require('./dist/main.js');
