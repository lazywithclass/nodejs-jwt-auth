angular.module('auth').component('users', {
  template: `
    <main>
      <table class="table">
        <thead>
          <tr>
            <th scope="col">Username</th>
            <th scope="col">Password</th>
          </tr>
        </thead>
        <tbody>
          <tr ng-repeat="">
            <th scope="row">1</th>
            <td>Mark</td>
            <td>Otto</td>
            <td>@mdo</td>
          </tr>
        </tbody>
      </table>
    </main>
  `,
  bindings: {
  },
  controller: function($http, $state) {
    $http
      .get('//test.app.localhost:3000/users')
      .then((res) => {
        // TODO request using cookie
        console.log(res)
      })
  }
});
