angular.module('auth').component('header', {
  template: `
  <nav class="navbar navbar-expand-lg navbar-light bg-light ml-auto">
      <div class="container">
          <ul class="nav navbar-nav mr-auto" ng-hide="$ctrl.$state.$current.name == 'login' || $ctrl.$state.$current.name == 'root'">
            <li class="nav-item">
                <a class="nav-link logout" href="/users" ng-class="{selected: $ctrl.$state.$current.name == 'users'}">Users</a>
            </li>
            <li class="nav-item">
                <a class="nav-link logout" href="/books" ng-class="{selected: $ctrl.$state.$current.name == 'books'}">Books</a>
            </li>
          </ul>
          <ul class="nav navbar-nav">
              <li class="nav-item" ng-hide="$ctrl.$state.$current.name == 'login' || $ctrl.$state.$current.name == 'root'">
                  <a class="nav-link logout" ng-click="$ctrl.logout()">Logout</a>
              </li>
          </ul>
      </div>
  </nav>
  `,
  bindings: {
  },
  controller: function($scope, $http, $state) {
    this.$state = $state

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
