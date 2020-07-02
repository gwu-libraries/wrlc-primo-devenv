// spec.js
const settings = require('./settings.json');
describe('Primo VE Customization Test Suite', function() {
  
  const EC = protractor.ExpectedConditions;

  beforeEach(async function() {
    // Open the basic search page
    //await browser.get(settings.searchUrl);
    await browser.executeScript('angular.reloadWithDebugInfo()');

  });


  async function doSearch(searchStr) {
      // search input
      let searchBar = await element(by.id('searchBar'));
      await browser.wait(EC.presenceOf(searchBar), 50000);

      let searchForm = await element(by.name('search-form'));// search form --> script triggers submit() 
      // Enter the MMS Id to search for
      await searchBar.sendKeys(searchStr);
      // Submit the search form
      await searchForm.submit();
      return 
  }

  async function clickFirstResult() {

    // The first result
      let briefResult = await element(by.css('prm-brief-result a'));
      // Wait for a brief result to appear -- should be only one, for an MMS ID search
      await browser.wait(EC.presenceOf(briefResult), 10000);
      await browser.sleep(500);
      // Click the result link
      // This workaround avoids the "click intercepted" error that the native Protractor click() function produces
      //await browser.actions().mouseMove(briefResult).click().perform();
      await browser.executeScript("arguments[0].click();", briefResult);
      await browser.sleep(500);
  }

  async function extractElData (elm, i) {
        // The text of the label 
        let label = await elm.getText();
        // Whether hidden or not
        let visibility = await elm.getCssValue('display');
        // The service type is embedded in the element's Angular scope
        // Here we ask the web driver to evaluate it and return the "serivce property"
        let type = await browser.wait(async function() {
            return await elm.evaluate('service');
          }, 1000);
        // Return the information for each service button
        return {
          index: i,
          label: label,
          type: type.type,
          visibility: visibility
        };
  }

  runAll(settings.tests, function(test, iteration) {
    it('should display correct links', async function() {

      await doSearch(test.mms_id);

      await clickFirstResult();

      let buttonData;
      
      try {
        // Angular component for a request service
        let primoServices = await element(by.tagName('prm-service-button')); 
        // Wait for the services to appear
        await browser.wait(EC.presenceOf(primoServices), 10000);

        // Sleep for five seconds, otherwise the scope data we need may not be loaded yet
        await browser.sleep(2000);
        // The component for each service button
        let serviceButtons = await element.all(by.tagName('prm-service-button')); 
        // Extract data from the service button components
        // Wrapped in Promise.all because these functions return promises
        buttonData = await Promise.all(serviceButtons.map(extractElData));

      }
      catch (e) {
        // In the absence of IZ holdings, a different Angular component is used
        if (e.name == 'TimeoutError') {
          let almaOVP = await element(by.tagName('alma-howovp'));
          await browser.wait(EC.presenceOf(almaOVP), 10000); 
          // Child elements that hold the service links in this instance
          let serviceButtons = await almaOVP.all(by.tagName('md-list-item'));
          buttonData = await Promise.all(serviceButtons.map(extractElData));

        }
      }
     
      //console.log(buttonData);
      
      buttonData.forEach(function(d) {
        if (test.hasOwnProperty(d.type)) {
      
          expect((d.visibility != 'none')).toEqual(test[d.type]);
        }
      });

    });
  });
});