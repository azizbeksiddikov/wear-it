$(document).ready(function () {
  // Password length validation
  $("#member-password").on("input", function () {
    const password = $(this).val();
    const helper = $(this).closest(".label").find(".password-helper");

    if (password.length >= 8) {
      helper.css("color", "#2ecc71"); // Green color
    } else {
      helper.css("color", "#e74c3c"); // Red color
    }
  });

  // Handle Phone formatting
  $("#member-phone").on("input", function (e) {
    let value = $(this)
      .val()
      .replace(/[^0-9]/g, "");

    if (value.length > 11) value = value.substr(0, 11);

    if (value.length >= 3 && value.length <= 7) {
      value = value.slice(0, 3) + "-" + value.slice(3);
    } else if (value.length > 7) {
      value =
        value.slice(0, 3) + "-" + value.slice(3, 7) + "-" + value.slice(7);
    }

    $(this).val(value);
  });

  // Password visibility toggle
  $(".toggle-password").click(function () {
    const inputField = $(this).siblings("input");
    const type = inputField.attr("type");

    if (type === "password") {
      $(this).removeClass("fa-eye").addClass("fa-eye-slash");
      inputField.attr("type", "text");
    } else {
      $(this).removeClass("fa-eye-slash").addClass("fa-eye");
      inputField.attr("type", "password");
    }
  });

  // Add password matching validation
  $("#member-password-confirm").on("input", function () {
    const password = $("#member-password").val();
    const confirmPassword = $(this).val();
    const smallElement = $("<small>").addClass("password-helper");

    // Remove existing helper text if any
    $(this).closest(".label").find(".password-helper").remove();

    if (confirmPassword && confirmPassword !== password) {
      smallElement.text("Passwords do not match!").css("color", "#e74c3c");
      $(this).closest(".label").append(smallElement);
    } else if (confirmPassword && confirmPassword === password) {
      smallElement.text("Passwords match!").css("color", "#2ecc71");
      $(this).closest(".label").append(smallElement);
    }
  });
});

function validateSignupForm() {
  const memberEmail = $("#member-email").val(),
    memberPhone = $("#member-phone").val(),
    memberPassword = $("#member-password").val(),
    memberPasswordConfirm = $("#member-password-confirm").val();

  // Validation checks
  if (
    !memberEmail ||
    !memberEmail.includes("@") ||
    memberEmail.split("@")[1].length < 3
  ) {
    alert("Please enter a valid email address");
    return false;
  }

  if (memberPassword !== memberPasswordConfirm) {
    alert("Passwords do not match");
    return false;
  }

  if (memberPhone && !memberPhone.match(/^[0-9]{3}-[0-9]{4}-[0-9]{4}$/)) {
    alert("Phone number format should be 010-1234-5678");
    return false;
  }
}
