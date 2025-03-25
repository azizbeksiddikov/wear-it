$(document).ready(function () {
  // Form validation
  $("#loginForm").on("submit", function (e) {
    const email = $("#memberEmail").val();
    const password = $("#memberPassword").val();

    if (!email || !password) {
      e.preventDefault();
      alert("Please fill in all fields");
      return false;
    }

    if (!isValidEmail(email)) {
      e.preventDefault();
      alert("Please enter a valid email address");
      return false;
    }
  });

  // Email validation helper function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
});
