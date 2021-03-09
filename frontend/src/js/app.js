angular
  .module('auth', ['ui.router', 'angular-jwt'])
  .config(function($stateProvider, $locationProvider) {

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    })

    var loginState = {
      name: 'login',
      url: '/login',
      component: 'login'
    }

    $stateProvider.state(loginState);
  })
