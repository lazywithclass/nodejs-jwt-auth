angular.module('auth').component('users', {
  template: `
    <table class="table" ng-show="$ctrl.canViewData">
      <thead>
        <tr>
          <th scope="col">Username</th>
          <th scope="col">Password</th>
          <th scope="col">Roles</th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="user in $ctrl.users">
          <td>{{user.username}}</td>
          <td>{{user.password}}</td>
          <td>{{user.roles}}</td>
        </tr>
      </tbody>
    </table>
    <span ng-show="!$ctrl.canViewData">You are not allowed to view this data</span>
  `,
  bindings: {
  },
  controller: function($http, $state) {
    this.canViewData = true
    const getUsers = () => {
      $http
        .get('//test.app.localhost:3000/users')
        .then((res) => {
          this.canViewData = true
          this.users = Object.values(res.data)
        })
        .catch(() => this.canViewData = false)
    }
    getUsers()
  }
});
