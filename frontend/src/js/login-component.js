angular.module('auth').component('login', {
  template: `
    <main class="form-signin">
      <form>
        <h1 class="h3 mb-3 fw-normal">Please sign in</h1>
        <label for="inputEmail" class="visually-hidden">Username</label>
        <input type="email" id="inputEmail" class="form-control" placeholder="Email address" required autofocus>
        <label for="inputPassword" class="visually-hidden">Password</label>
        <input type="password" id="inputPassword" class="form-control" placeholder="Password" required>
        <div class="mb-3">
          <a href="forgot-password.html">Forgot your password?</a>
        </div>
        <button class="w-100 btn btn-lg btn-primary" type="submit">Sign in</button>
      </form>
    </main>
  `,
  bindings: {
  },
  controller: function() {
    console.log("LOGIN")

  }
});
