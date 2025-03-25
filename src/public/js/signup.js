$(document).ready(function () {
  // Form validation
  $("form").on("submit", function (e) {
    const email = $("#memberEmail").val();
    const phone = $("#memberPhone").val();
    const password = $("#memberPassword").val();

    if (!email || !phone || !password) {
      e.preventDefault();
      alert("Please fill in all fields");
      return false;
    }

    if (!isValidEmail(email)) {
      e.preventDefault();
      alert("Please enter a valid email address");
      return false;
    }

    if (!isValidPhone(phone)) {
      e.preventDefault();
      alert("Please enter a valid 10-digit phone number");
      return false;
    }

    if (password.length < 6) {
      e.preventDefault();
      alert("Password must be at least 6 characters long");
      return false;
    }
  });

  // Email validation helper function
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone validation helper function
  function isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone);
  }

  // Format phone number as user types
  $("#memberPhone").on("input", function () {
    let value = $(this).val().replace(/\D/g, "");
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    $(this).val(value);
  });
});
