angular.module('auth').component('login', {
  template: `
    <main class="form-signin">
      <form ng-submit="$ctrl.submit(user)">
        <h1 class="h3 mb-3 fw-normal">Please sign in</h1>
        <label for="inputUsername" class="visually-hidden">Username</label>
        <input ng-model="user.username" type="text" id="inputUsername" class="form-control" placeholder="Username" required autofocus>
        <label for="inputPassword" class="visually-hidden">Password</label>
        <input ng-model="user.password" type="password" id="inputPassword" class="form-control" placeholder="Password" required>
        <div class="mb-3">
          <a href="forgot-password.html">Forgot your password?</a>
        </div>
        <div class="mb-3">
          <span>{{$ctrl.errorMessage}}</span>
        </div>
        <button class="w-100 btn btn-lg btn-primary" type="submit">Sign in</button>
      </form>
    </main>
  `,
  bindings: {
  },
  controller: function($http, $state) {

    this.submit = (user) => {
      this.errorMessage = ""
      // TODO remove url and pass it somehow
      $http
        .post('//test.app.localhost:3000/login', user)
        .then((res) => $state.go('users'))
        .catch((res) => this.errorMessage = res.data.message)
    }

  }
});
