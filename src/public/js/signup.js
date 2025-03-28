$(document).ready(function () {
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
