(function (window, angular) {
  'use strict';

  /**
   * @ngdoc overview
   * @name angulartics.intercom
   * Enables analytics support for Intercom (http://intercom.io)
   */
  angular
    .module('angulartics.intercom', ['angulartics'])
    .directive('analyticsIntercom', ['$analytics', function ($analytics) {
      return {
        restrict: 'A',
        priority: 100,
        link: function (scope, el, attr) {
          if ($analytics.settings.intercomRequiresAttribute) {
            var props = scope.$eval(attr.analyticsProperties) || {};

            props.intercomEnabled = true;
            attr.analyticsProperties = JSON.stringify(props);
          }
        }
      };
    }])
    .config(['$analyticsProvider', function ($analyticsProvider) {
      $analyticsProvider.registerPageTrack(function (path) {
        if (!window.Intercom) {
          return;
        }

        if (!$analyticsProvider.settings.intercomRequiresAttribute) {
          window.Intercom('trackEvent', 'visit_page', {
            url: path
          });
        }

        if ($analyticsProvider.settings.intercomHideLauncher) {
          angulartics.waitForVendorApi("Intercom", 1000, function(intercom) {
            if (window.Intercom) {
              window.Intercom('update', { hide_default_launcher: true });
            }
          });
        }

      });

      /**
       * Track Event in GA
       * @name eventTrack
       *
       * @param {string} action Required 'action' (string) associated with the event
       * @param {object} properties Comprised of the mandatory field 'category' (string) and optional  fields 'label' (string), 'value' (integer) and 'noninteraction' (boolean)
       *
       * Sends events like 'click_users_search_users'
       */
      $analyticsProvider.registerEventTrack(function (action, properties) {
        properties = properties || {};

        if (!window.Intercom) {
          return;
        } else if ($analyticsProvider.settings.intercomRequiresAttribute && !properties.intercomEnabled) {
          return;
        }

        var eventFormat = $analyticsProvider.settings.eventFormat || {
          eventType: false,
          category: false,
          label: false
        };

        var tokens = [ action ];

        if (properties.eventType && eventFormat.eventType) {
          tokens.unshift(properties.eventType);
        }

        if (properties.category && eventFormat.category) {
          tokens.push(properties.category);
        }

        if (properties.label && eventFormat.label) {
          tokens.push(properties.label);
        }

        delete properties.eventType;
        delete properties.category;
        delete properties.label;
        delete properties.intercom;
        delete properties.intercomEnabled;

        if (JSON.stringify(properties) === '{}') {
          properties = undefined;
        }

        window.Intercom('trackEvent', tokens.join(' ').toLowerCase(), properties);
      });

      /**
       * Set Username
       * @name setUsername
       *
       * @param {string} userId Registers User ID of user for use with other hits
       * @param {object} properties Registers properties of user for use with other hits
       */
      $analyticsProvider.registerSetUsername(function (userId, properties) {
        if (window.Intercom) {
          var data = angular.extend({}, { 'user_id': userId }, getCustomProperties(properties));
          window.Intercom('update', data);
        }
      });

      /**
       * Set User Properties
       * @name setUserProperties
       *
       * @param {object} properties Registers properties of user for use with other hits
       */
      $analyticsProvider.registerSetUserProperties(function (properties) {
        if (window.Intercom && !angular.equals({}, getCustomProperties(properties))) {
          window.Intercom('update', getCustomProperties(properties));
        }
      });

      /**
       * Disconnect from analytics provider
       *
       */
      $analyticsProvider.registerClearCookies(function() {
        if(window.Intercom) {
          window.Intercom('shutdown');
        }
      });

      /**
       * Extract Custom Data for a hit
       * @name getCustomProperties
       *
       * @param {object} properties object from an API call that is filtered for Custom Intercom Properties
       *
       * @returns {object} customData object with Custom Intercom Properties from properties argument
       */
      function getCustomProperties(properties) {
        var customData = properties.intercom || {};
        return customData;
      }

    }]);
})(window, window.angular);
