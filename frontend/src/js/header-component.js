angular.module('auth').component('header', {
  template: `
  <nav class="navbar navbar-expand-lg navbar-light bg-light ml-auto">
      <div class="container">
          <ul class="nav navbar-nav mr-auto">
            <li class="nav-item">
                <a class="nav-link logout" href="/users">Users</a>
            </li>
            <li class="nav-item">
                <a class="nav-link logout" href="/books">Books</a>
            </li>
          </ul>
          <ul class="nav navbar-nav">
              <li class="nav-item" ng-hide="$ctrl.userIsLoggedOut">
                  <a class="nav-link logout" ng-click="$ctrl.logout()">Logout</a>
              </li>
          </ul>
      </div>
  </nav>
  `,
  bindings: {
  },
  controller: function($scope, $http, $state) {
    this.userIsLoggedOut = true
    $scope.$watch(() => {
      return $state.$current.name
    }, (newVal, oldVal) => {
      $http
        .get('//test.app.localhost:3000/whoami')
        .then((res) => this.userIsLoggedOut = false)
        .catch((res) => this.userIsLoggedOut = true)
    })

    this.logout = () => {
      $http
        .post('//test.app.localhost:3000/logout', {})
        .then((res) => {
          this.userIsLoggedOut = true
          $state.go('login')
        })
        .catch((res) => {
          this.userIsLoggedOut = true
          $state.go('login')
        })
    }
  }
});
