$(document).ready(function () {
  // Prevent non-numeric input for phone
  $("#memberPhone").on("keypress", function (e) {
    if (e.key.match(/[^0-9]/)) {
      e.preventDefault();
    }
  });

  // Handle paste event - strip non-numeric
  $("#memberPhone").on("paste", function (e) {
    e.preventDefault();
    let pastedText = (
      e.originalEvent.clipboardData || window.clipboardData
    ).getData("text");
    pastedText = pastedText.replace(/[^0-9]/g, "");

    let value = this.value + pastedText;
    if (value.length > 11) value = value.substr(0, 11);

    // Format with hyphens
    if (value.length >= 3 && value.length <= 7) {
      value = value.slice(0, 3) + "-" + value.slice(3);
    } else if (value.length > 7) {
      value =
        value.slice(0, 3) + "-" + value.slice(3, 7) + "-" + value.slice(7);
    }

    $(this).val(value);
  });

  // Handle input formatting
  $("#memberPhone").on("input", function (e) {
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

  $("#signupForm").on("submit", function (e) {
    e.preventDefault();

    const formData = {
      memberEmail: $("#memberEmail").val(),
      memberPassword: $("#memberPassword").val(),
      memberPasswordConfirm: $("#memberPasswordConfirm").val(),
      memberPhone: $("#memberPhone").val(),
    };

    // Validation checks
    if (
      !formData.memberEmail ||
      !formData.memberEmail.includes("@") ||
      formData.memberEmail.split("@")[1].length < 3
    ) {
      alert("Please enter a valid email address");
      return;
    }

    if (!formData.memberPassword || formData.memberPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    if (formData.memberPassword !== formData.memberPasswordConfirm) {
      alert("Passwords do not match");
      return;
    }

    if (
      formData.memberPhone &&
      !formData.memberPhone.match(/^01[0-9]-[0-9]{3,4}-[0-9]{4}$/)
    ) {
      alert("Phone number format should be 010-1234-5678");
      return;
    }

    // Submit form data using AJAX
    $.ajax({
      url: "/admin/signup",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify(formData),
      success: function (response) {
        window.location.href = "/admin/product/all";
      },
      error: function (xhr, status, error) {
        alert(xhr.responseText || "An error occurred during signup");
      },
    });
  });
});
