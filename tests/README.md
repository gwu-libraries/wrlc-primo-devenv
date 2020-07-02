### End-to-end testing for Primo customizations 

These tests check for the visibility of Primo service links (direct/hold request and resource-sharing) in a given environment. 

#### How to run the tests

1. Install [protractor.js](https://www.protractortest.org/#/protractor-setup).
2. Edit `tests/settings.json` to update the following information:
  - A Primo search URL, including the name of the view that you want to test.
  - A username and password, if login is required to access services.
  - MMS Id numbers for specific records you wish to test.
  - For each record, whether the direct/hold request (`AlmaRequest`) and resource-sharing (`AlmaResourceSharing`) links should be visible.
3. Depending on your authentication set up, you may need to edit the code in `tests/conf.js`, which presently refers to elements present on GW's single-sign-on page. (`conf.js` handles authentication, allowing the tests to run in a logged-in state.)
4. Launch the Selenium web-driver service from a terminal window: `webdriver-manager start`.
5. From another terminal, run `protractor tests/conf.js` to start the tests.
