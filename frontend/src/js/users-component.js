angular.module('auth').component('users', {
  template: `
    <table class="table">
      <thead>
        <tr>
          <th scope="col">Username</th>
          <th scope="col">Password</th>
          <th scope="col">Roles</th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="user in $ctrl.users">
          <th scope="row">{{user.username}}</th>
          <td>{{user.password}}</td>
          <td>{{user.roles}}</td>
        </tr>
      </tbody>
    </table>
  `,
  bindings: {
  },
  controller: function($http, $state) {
    $http
      .get('//test.app.localhost:3000/users')
      .then((res) => {
        this.users = Object.values(res.data)
      })
      .catch((res) => {
        $state.go('login')
      })
  }
});
