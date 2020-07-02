(function () {
    "use strict";
    'use strict';

    var app = angular.module('viewCustom', ['angularLoad', 'wrlcAnnounce', 'illCard', 'hideService']);

    var jQueryScript = document.createElement("script");  
    
    jQueryScript.src = "https://code.jquery.com/jquery-3.3.1.min.js";  
    document.getElementsByTagName("head")[0].appendChild(jQueryScript);  
      
      
    jQueryScript.onload = function() {  
        $(document).ready(function(){            
        });  
    };  

    app.value('wrlcFooterConfig', {
        message: 'This service is provided by <a href="https://library.gwu.edu">GW Libraries</a> in partnership with the <a href="https://www.wrlc.org">Washington Research Library Consortium</a>'
    });
    /****************************************************************************************************/

    /*In case of CENTRAL_PACKAGE - comment out the below line to replace the other module definition*/

    /*var app = angular.module('centralCustom', ['angularLoad']);*/

    /****************************************************************************************************/

    /* Increases default results page shown to 2 pages (20 results) 
     * stolen from University of Denver's Primo instance https://library.du.edu/
     */
    app.component('prmExploreMainAfter', {
        bindings: { parentCtrl: '<' },
        controller: function controller($scope) {
            var vm = this;
            vm.parentCtrl.searchService.cheetah.configurationUtil.searchStateService.resultsBulkSize = 20;
        }
    });

    /*
     * end increase default results
     */

    /* Insert found a problem link */
    app.controller('FullViewServiceContainerAfterController', [function () {
        var vm = this;
        
        function getPermalink() {
            var currentURL = encodeURIComponent(window.location.href),
                foundProblemForm = 'https://library.gwu.edu/found-problem';
            foundProblemForm += ('?url=' + currentURL); 
            //return 'https://library.gwu.edu/found-problem';
            return foundProblemForm;
        }
        vm.getPermalink = getPermalink;
        
    }]);
    app.component('prmFullViewServiceContainerAfter', {
        bindings: { parentCtrl: '<' },
        controller: 'FullViewServiceContainerAfterController',
        template: '<a class="layout-align-left-left layout-column" id="found-problem" href="{{ $ctrl.getPermalink() }}" target="_blank">Found a Problem?</a>'
    });

    /*
      // Uncomment for test profile customization package    
      // Add link to fines and fees payment 
        app.component('prmFinesAfter', {
                template: '<a class="layout-align-center-center layout-column" id="payment-button" href="https://gwfines-dev.wrlc.org/pay" target="_blank">Pay Fines</a>'
        });
    */

    /* configuration for WRLC banner */
    app.constant('announceConfig', {
        announceAPI: 'https://spreadsheets.google.com/feeds/list/1E4qRAR2RolPZJlf8V1eszR7OejM3ThUCL3M3rhdfq4k/1/public/values?alt=json',
        getShow: function getShow(response) {
            return response.data.feed.entry[0].gsx$show.$t;
        },
        getMessage: function getMessage(response) {
            return response.data.feed.entry[0].gsx$message.$t;
        },
        getLink: function getLink(response) {
            return response.data.feed.entry[0].gsx$link.$t;
        }
    });
    /* end banner configuration */

    /* ILL Card in account */
    app.constant('illCardConfig', {
        card_title: 'Check Interlibrary Loan Requests',
        message: 'Sign in to Interlibrary Loan to view your interlibrary account information.',
        signon_url: 'https://proxygw.wrlc.org/login?url=https://gwu.illiad.oclc.org/illiad/illiad.dll',
        link_text: 'Sign into Interlibrary Loan'
    });
    /* End ILL card config*/

    /*************************************************************************************************

    Hide services not desired based on availability conditions. 

    This pattern defines an Angular service -- serviceStatus -- to allow data-sharing between components that do not share the same scope. 

    One controller can call the service to update a data element, and another controller can call the service to access that data element.

    *************************************************************************************************/

    app.factory('serviceStatus', ['$rootScope', function($rootScope) {
      // Initialize the object
      let services = {};
      // Update function to be called by a controller asynchronously
      services.updateStatus = function(key, value) {
        services[key] = value;
        // Broadcast the change 
        $rootScope.$broadcast('serviceStatus:updated', services);
      };
      // Property getter to be invoked by a controller
      services.getStatus = function(key) {
        if (services.hasOwnProperty(key)) return services[key];
      }
      // Property setters to be invoked by a controller
      services.setStatus = function(key, value) {
        services[key] = value;
      }

      return services;
    }]);

    //This component inherits scope containing information about the resource itself when the latter is available in the user's IZ
   app.controller('hideServiceTestController', ['serviceStatus', '$scope', function (serviceStatus, $scope) {
      let ctrl = this;
      // Check for availability in home library
      let isIZavailable = ctrl.parentCtrl.item.delivery.availability.indexOf('available_in_library') > -1;
      serviceStatus.setStatus('isIZavailable', isIZavailable);
      // Check for the presence of other institutions
      let otherInstitutions = ctrl.parentCtrl.item.delivery.almaInstitutionsList;
      otherInstitutions = otherInstitutions && otherInstitutions.length > 0;
      serviceStatus.setStatus('otherInstitutions', otherInstitutions);
      // Watch for the services to be fetched -- they aren't ready when this component is first loaded
      // If the item information doesn't appear on the first full result screen, this property won't be populated
      $scope.$watch('$ctrl.parentCtrl.locationServices', function(locationServices) {
        if (locationServices) { 
          // serviceInfo should be an array containing the available services for this item
          let services = locationServices.serviceinfo.map(function(s) {
            return s.type;
          });
            // Check for the presence of AlmaRequest 
          if (services.indexOf('AlmaRequest') == -1) serviceStatus.updateStatus('AlmaRequest', false);
          else serviceStatus.updateStatus('AlmaRequest', true);
        }
      });
    }]).component('prmRequestServicesAfter', {
                  bindings: {
                    parentCtrl: '<'
                  },
                  controller: 'hideServiceTestController',
                  template: ''
                });
    //This component holds the service links
    app.controller('hideServiceButtonController', ['$scope', 'serviceStatus', '$element', function($scope, serviceStatus, $element) {
      let ctrl = this;
      // Type of service provided by this button
      let thisService = ctrl.parentCtrl.service.type;

      function hideService(services) {
        // Encapsulates case logic to determine when to hide the resource-sharing request service
        //Availability of the current item
        let isIZavailable = services.getStatus('isIZavailable'),
          // Presence of holdings at other institutions
          otherInstitutions = services.getStatus('otherInstitutions'),
          // Presence of Direct Request service
          directRequestStatus = services.getStatus('AlmaRequest'),
          // The parent of the current component, which holds the service link we want to hide
          parentEl = $element.parent()[0];
          console.log(services)
          // Case 1: There's a Direct Request service and the item is available at the home IZ
          if (services.getStatus('AlmaRequest') && (isIZavailable)) {
            // Access the parent element of the current directive to which this controller is applied
            hideServiceLink(parentEl);
          }
          // Case 2: There's an item available at the home IZ and the other request services haven't loaded yet
          else if (isIZavailable && (typeof directRequestStatus == 'undefined')) {
            hideServiceLink(parentEl);
          }
          // Case 3: The home IZ item is unavailable and there are no partner institutions
          //else if (!isIZavailable && !(otherInstitutions)) {
          else if (!otherInstitutions) {
            hideServiceLink(parentEl);
          }
      }

      function hideServiceLink(el) {
        // AngularJS docs advise against modifying the DOM in a controller, but we don't have the ability to add our own components (the preferred method) or otherwise to modify existing ones
        try {
          angular.element(el).css('display', 'none');
        }
        catch (error) {
          console.log(error)
        }
      }
      // listen for a change broadcast by serviceStatus
      $scope.$on('serviceStatus:updated', function(e, services) {
        // When other services are loaded, test (again) to see if we need to hide the current service
        if (thisService == 'AlmaResourceSharing') {
          hideService(services);
        }
      })
      // If the current component has a resource-sharing service, check to see if we should hide it
      if (thisService == 'AlmaResourceSharing') {
        hideService(serviceStatus);
      }
    }]).component('prmServiceButtonAfter', {
                  bindings: {
                    parentCtrl: '<'
                  },
                  controller: 'hideServiceButtonController',
                  template: ''
                });

    // Essentially this:
    //  Figures out whether you own the item based on information Primo provides at load (and on page updates)
    //  Figures out whether partner schools own the item based on information Primo provides at load (and on page updates)
    //  Checks to see if there are services you want hidden
    //  Checks to see if you're already hiding them
    //  Based on who owns the item -- and the criteria for hiding services -- either adds or removes CSS statements to hide/show the service
    angular.module('hideService', [])
        .controller('hideServiceController', ['hideServiceConfig', function (hideServiceConfig) {
            const self = this;
            const itemDetails = self.parentCtrl.item;

        // Are there partner schools with the item
            const partners = itemDetails.delivery.almaInstitutionsList && itemDetails.delivery.almaInstitutionsList.length >= 1;

         // Do you own the item
            const localHolding = itemDetails.delivery.holding;

        // What style rules already exist
             const styleEls = document.querySelectorAll('style');

         // Arguably this structure overcomplicates things in the interest of being extensible.
         // If we're only ever going to want to hide the AFN service then there's no need to accomodate an array of potential services each with their own logic for hide/show
         // which would cut the code in half.

        for (let j = 0; j < hideServiceConfig.servicesToHide.length; j++) {
              const service = hideServiceConfig.servicesToHide[j];
             for (let i = 0; i < styleEls.length; i++) {
                 const el = styleEls[i];

                // This uses dynamic stylesheets instead of directly hiding the element since it will never exist during the initial load
                // An alternative strategy would be to keep polling the page for some period of time to see if it shows up

                // If the stylesheet exists, check the config to see if the service should be displayed
                if (el.innerText === 'md-list-item[ng-repeat="service in $ctrl.filteredServices() track by $index"]:nth-child(' + service.index + ') { display: none; }') {
                          const show = Function(`
                            "use strict";
                             const partners=` + partners + `;
                             const localHolding=` + localHolding + `;
                            return (` + service.showCondition + `);`)()
                         if (show) {
                          el.parentNode.removeChild(el);
                         }

                     // If you've looked at all the stylesheets and it doesn't exist check to see if the service should be hidden
                 } else if (i === styleEls.length - 1) {
                    const hide = Function(`
                          "use strict";
                            const partners=` + partners + `;
                            const localHolding=` + localHolding + `;
                             return (` + service.hideCondition + `);`)()
                     if (hide) {
                        const css = document.createElement('style');
                        const styles = 'md-list-item[ng-repeat="service in $ctrl.filteredServices() track by $index"]:nth-child(' + service.index + ') { display: none; }';
                        css.type = 'text/css';
                        if (css.styleSheet) {
                          css.styleSheet.cssText = styles;
                         } else {
                            css.appendChild(document.createTextNode(styles));
                            document.getElementsByTagName("head")[0].appendChild(css);
                        }
                    }
                }
            }
         }
    }]).component('almaHowovpAfter', {
              bindings: {
                parentCtrl: '<'
              },
              controller: 'hideServiceController',
              template: ''
            });

    app.constant('hideServiceConfig', {
        servicesToHide: [{
          index: 1,
          hideCondition: '!partners && !localHolding',
          showCondition: 'partners && !localHolding'
        }]
    });


})();
