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
          <td>{{user.username}}</td>
          <td>{{user.password}}</td>
          <td>{{user.roles}}</td>
        </tr>
      </tbody>
    </table>
  `,
  bindings: {
  },
  controller: function($http, $state) {
    const getUsers = () => {
      $http
        .get('//test.app.localhost:3000/users')
        .then((res) => this.users = Object.values(res.data))
        .catch(() => $state.go('login'))
    }
    getUsers()
  }
});
