/**
 * Portal Apps (Microfrontends) should NEVER bring there own polyfills.
 * If you really need some you have to add it to the theme so it is available globally.
 *
 * Since this is just a demo App we leave zone.js here but for real live Angular Apps it must be removed.
 */

/**
 * Zone JS is required by Angular itself.
 */
import 'zone.js/dist/zone';  // Included with Angular CLI.

