angular.module('auth').component('books', {
  template: `

    <table class="table" ng-show="$ctrl.canViewData">
      <thead>
        <tr>
          <th scope="col">Title</th>
          <th scope="col">Author</th>
        </tr>
      </thead>
      <tbody>
        <tr ng-repeat="book in $ctrl.books">
          <td>{{book.title}}</td>
          <td>{{book.author}}</td>
        </tr>
      </tbody>
    </table>
    <span ng-show="!$ctrl.canViewData">You are not allowed to view this data</span>
  `,
  bindings: {
  },
  controller: function($http, $state) {
    this.canViewData = true
    $http
      .get('//test.app.localhost:3042/books')
      .then((res) => {
        this.canViewData = true
        this.books = Object.values(res.data)
      })
      .catch((e) => {
        this.canViewData = false
      })
  }
});
