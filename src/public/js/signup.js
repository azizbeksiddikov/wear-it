$(document).ready(function () {
  // Form validation
  $("#signupForm").on("submit", function (e) {
    e.preventDefault();
    const email = $("#memberEmail").val();
    const password = $("#memberPassword").val();
    const memberPasswordConfirm = $("#memberPasswordConfirm").val();
    const phone = $("#memberPhone").val();

    // Email check
    if (!email || !email.includes("@") || email.split("@")[1].length < 3) {
      alert("Please enter a valid email address");
      return;
    }

    // Password check
    if (!password || password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    // Password confirmation check
    if (password !== memberPasswordConfirm) {
      alert("Passwords do not match");
      return;
    }

    // Phone format check (if provided)
    if (phone && !phone.match(/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/)) {
      alert("Phone number format should be 010-1234-5678");
      return;
    }

    // If all checks pass, submit the form
    this.submit();
  });
});
