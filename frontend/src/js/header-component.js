angular.module('auth').component('header', {
  template: `
  <nav class="navbar navbar-expand-lg navbar-light bg-light ml-auto">
      <div class="container">
          <ul class="nav navbar-nav mr-auto"></ul>
          <ul class="nav navbar-nav">
              <li class="nav-item" ng-hide="$ctrl.userIsLoggedOut">
                  <a class="nav-link" href="#">Logout</a>
              </li>
          </ul>
      </div>
  </nav>
  `,
  bindings: {
  },
  controller: function($http, $state) {
    this.userIsLoggedOut = true
    $http
      .get('//test.app.localhost:3000/whoami')
      .then((res) => {
        console.log("WHOAMI", res)
        this.userIsLoggedOut = false
      })
      .catch((res) => {
        this.userIsLoggedOut = true
      })
  }
});
