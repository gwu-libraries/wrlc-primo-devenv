// conf.js

//const baseUrl = 'https://wrlc-gwu-psb.primo.exlibrisgroup.com/discovery/search?vid=01WRLC_GWA:test&lang=en&sortby=rank';
const settings = require('./settings.json');

exports.config = {
  framework: 'jasmine',
  
  seleniumAddress: 'http://localhost:4444/wd/hub',
  
  specs: ['spec.js'],
  
  SELENIUM_PROMISE_MANAGER: false,

  allScriptsTimeout: 10000, // necessary to avoid a ScriptTimeoutError
  
  onPrepare: async function() {
    // Load the helper utility that will loop through the tests
    global.runAll = require('./all_tests')

  	await browser.driver.get(settings.baseUrl);
  	// Click the sign in button in Primo
    await browser.driver.sleep(1150);
  	let signIn = browser.driver.findElement(by.id('signInBtn'));
  	await signIn.click();
  	// Select the Other GW affiliate sign-in optiom
  	let loginButton = await element(by.repeater('authenticationMethod in $ctrl.authenticationMethods').row(2));
  	await loginButton.click();
  	// Wait for the Microsoft SSO page to load
  	await browser.driver.wait(async function () {
  		let url = await browser.driver.getCurrentUrl();
  		//console.log(url);
  		return /microsoftonline/.test(url);
  	}, 5000);
  	// Enter the user name 
    let username =  browser.driver.findElement(by.name('loginfmt'));
  	await username.sendKeys(settings.username);
  	await browser.driver.findElement(by.id('idSIButton9')).click();
    // Wait for the button to reload
    await browser.driver.sleep(1150);
    // Enter the password
  	let password = browser.driver.findElement(by.name('passwd'));
  	await password.sendKeys(settings.password);
  	await browser.driver.findElement(by.id('idSIButton9')).click();
    // Handle the "Stay signed-in" form
    await browser.driver.sleep(1150);
    await browser.driver.findElement(by.id('idSIButton9')).click();
    // Wait for the page to load upon login
    await await browser.driver.wait(async function () {
      let url = await browser.driver.getCurrentUrl();
      // Returns true when the Primo page has reloaded
      return /exlibrisgroup/.test(url);
    }, 1000);
    // Turn on Angular debugging so that we can access Angular element scopes
    await browser.executeScript('angular.reloadWithDebugInfo()');
    // The above reloads the page, so we need to wait again
    await browser.driver.sleep(5000);
    /*await browser.driver.wait(async function () {
      let url = await browser.driver.getCurrentUrl();
      return /exlibrisgroup/.test(url);
    }, 1000);*/

  }

}