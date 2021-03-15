angular
  .module('auth', ['ui.router', 'angular-jwt'])
  .config(function($stateProvider, $locationProvider) {

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    })

    $stateProvider.state({name: 'root', url: '/', component: 'login'})
    $stateProvider.state({name: 'login', url: '/login', component: 'login'})
    $stateProvider.state({name: 'users', url: '/users', component: 'users'})
    $stateProvider.state({name: 'books', url: '/books', component: 'books'})
  })
  .config(['$httpProvider', function($httpProvider) {
    $httpProvider.defaults.withCredentials = true
    $httpProvider.defaults.xsrfCookieName = 'token'
  }])
