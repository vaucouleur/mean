'use strict';

(function () {

  describe('Authentication Service', function () {

    var $rootScope;
    var $location;
    var $http;
    var $httpBackend;
    var $stateParams;
    var $state;
    var $q;

    var token = 'someToken';
    var user = {
      _id: '507f191e810c19729de860ea',
      username: 'Someone'
    };

    beforeEach(module(ApplicationConfiguration.applicationModuleName));

    beforeEach(inject(function (_$rootScope_, _$location_, _$http_, _$stateParams_, _$httpBackend_, _$state_, _$q_) {
      $rootScope = _$rootScope_;
      $location = _$location_;
      $http = _$http_;
      $stateParams = _$stateParams_;
      $httpBackend = _$httpBackend_;
      $state = _$state_;
      $q = _$q_;
    }));

    beforeEach(function () {
      jasmine.addMatchers({
        toEqualData: function (util, customEqualityTesters) {
          return {
            compare: function (actual, expected) {
              return {
                pass: angular.equals(actual, expected)
              };
            }
          };
        }
      });
    });

    describe('Default Injected Service', function () {

      var Authentication;

      beforeEach(inject(function (_Authentication_) {
        Authentication = _Authentication_;
      }));

      it('should construct the service', function () {
        expect(typeof Authentication.ready).toEqual('object');
        expect(Authentication.ready.then instanceof Function).toBe(true);
        expect(Authentication.user).toBe(null);
        expect(Authentication.token).toBe(null);
        expect(Authentication.login instanceof Function).toBe(true);
        expect(Authentication.signout instanceof Function).toBe(true);
        expect(Authentication.refresh instanceof Function).toBe(true);
      });
    });

    describe('After login()', function () {

      var Authentication;
      var resolved;

      beforeEach(inject(function (_Authentication_) {
        Authentication = _Authentication_;
        Authentication.ready.then(function () {
          resolved = true;
        });

        $httpBackend.when(
          'GET',
          'api/users/me',
          undefined,
          function (headers) {
            {
              return headers.Authorization === 'JWT ' + token;
            }
          }
        ).respond(200, '');

        Authentication.login(user, token);
        $rootScope.$digest();
      }));

      it('should set the service variables', function () {
        expect(Authentication.user.username).toBe(user.username);
        expect(Authentication.token).toBe(token);
      });

      it('should set the token in local storage', function () {
        var storedToken = localStorage.getItem('token');
        expect(storedToken).toBe(token);
      });

      it('should set the $http Authorization header', function () {
        var expected = 'JWT ' + token;
        expect($http.defaults.headers.common.Authorization).toBe(expected);
      });

      it('should set the $http Authorization header on the http request', function () {
        Authentication.refresh();
        $httpBackend.flush();
      });

      it('should resolve the ready promise', function () {
        expect(resolved).toBe(true);
      });
    });

    describe('Token on URL', function () {
      it('should take the token and load the user', function () {
        //This will hit the /api/users/me route to load the user into service.user
        //$http.get('/api/users/me/')
      });

      it('should remove the token from the URL', function () {
        //This will hit the /api/users/me route to load the user into service.user
      });
    });

    describe('refresh()', function () {

      var Authentication;

      beforeEach(inject(function (_Authentication_) {
        Authentication = _Authentication_;
        $httpBackend.when(
          'GET',
          'api/users/me',
          undefined,
          function (headers) {
            {
              return headers.Authorization === 'JWT ' + token;
            }
          }
        ).respond(200, '');

        Authentication.login(user, token);
        $httpBackend.flush();
        $rootScope.$digest();
      }));

      it('reset the ready promise', function (done) {
        Authentication.refresh().finally(done);
        $httpBackend.flush();
      });

      it('should take the token and reload the user', function (done) {
        var previousUser = Authentication.user;
        Authentication.refresh()
          .then(function() {
            expect(Authentication.user !== previousUser).toBe(true);
          })
          .finally(done);
        $httpBackend.flush();
      });
    });

    describe('After signout()', function () {

      var Authentication;

      beforeEach(inject(function (_Authentication_) {
        Authentication = _Authentication_;
        Authentication.login(user, token);
        Authentication.signout();
      }));

      it('should set service variables to null', function () {
        expect(Authentication.user).toBe(null);
        expect(Authentication.token).toBe(null);
      });

      it('should remove token from local storage', function () {
        var storedToken = localStorage.getItem('token');
        expect(storedToken).toBe(null);
      });

      it('should reload the current state', function () {
        $rootScope.$digest();
        expect($state.is('home')).toBe(true);
      });
    });

  }); // End tests
})();
