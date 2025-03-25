$(document).ready(function () {
  console.log("Signup frontend JavaScript loaded.");

  // Cache DOM elements
  const $form = $("#signupForm");
  const $email = $("#memberEmail");
  const $phone = $("#memberPhone");
  const $password = $("#memberPassword");
  const $profileImageInput = $("#profileImage");
  const $imagePreview = $("#imagePreview");
  const $imageUploadContainer = $(".image-upload-container");

  // FORM VALIDATION
  $form.on("submit", function (e) {
    const email = $email.val().trim();
    const phone = $phone.val().trim();
    const password = $password.val().trim();
    const profileImage = $profileImageInput.get(0).files[0];

    console.log("*********", email, phone, password);
    if (!email || !phone || !password) {
      e.preventDefault();
      alert("Please fill in all required fields.");
      return false;
    }

    if (!isValidEmail(email)) {
      e.preventDefault();
      alert("Please enter a valid email address.");
      return false;
    }

    if (!isValidPhone(phone)) {
      e.preventDefault();
      alert("Please enter a valid phone number (010-xxxx-xxxx).");
      return false;
    }

    if (!isValidPassword(password)) {
      alert(
        "Password must be at least 8 characters long, contain number, lowercase and uppercase letters"
      );
    }

    if (!profileImage) {
      e.preventDefault();
      alert("Please upload a profile image.");
      return false;
    }
  });

  // Email check
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  $email.on("input", function () {
    const value = $(this).val().trim();
    if (isValidEmail(value)) {
      $(this).removeClass("is-invalid").addClass("is-valid");
    } else {
      $(this).removeClass("is-valid");
    }
  });

  // Phone Number check
  function isValidPhone(phone) {
    const phoneRegex = /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/;
    return phoneRegex.test(phone);
  }

  $phone.on("input", function () {
    let value = $(this).val().replace(/\D/g, ""); // Remove non-numeric characters

    if (value.length > 10) {
      value = value.slice(0, 11);
    }

    if (value.length > 7) {
      value =
        value.slice(0, 3) + "-" + value.slice(3, 7) + "-" + value.slice(7);
    } else if (value.length > 3) {
      value = value.slice(0, 3) + "-" + value.slice(3);
    }

    $(this).val(value);
    if (isValidPhone(value)) {
      $(this).removeClass("is-invalid").addClass("is-valid");
    } else {
      $(this).removeClass("is-valid");
    }
  });

  // Password check
  function isValidPassword(password) {
    // Regex for:
    // - At least one lowercase letter
    // - At least one uppercase letter
    // - At least one number
    // - At least 8 characters in total
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
    return passwordRegex.test(password);
  }

  $password.on("input", function () {
    let value = $(this).val();

    if (isValidPassword(value)) {
      $(this).removeClass("is-invalid").addClass("is-valid");
    } else {
      $(this).removeClass("is-valid");
    }
  });

  // memberImage check
  $profileImageInput.on("change", function () {
    const file = this.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image (JPEG, PNG, or JPG).");
      resetImageUpload();
      return;
    }

    if (file.size > maxSize) {
      alert("Image size should be less than 5MB.");
      resetImageUpload();
      return;
    }

    // Use URL.createObjectURL for better performance
    $imagePreview.attr("src", URL.createObjectURL(file)).addClass("success");
    $imageUploadContainer.addClass("has-image");
  });

  function resetImageUpload() {
    $profileImageInput.val("");
    $imagePreview.attr("src", "/img/default-user.webp").removeClass("success");
    $imageUploadContainer.removeClass("has-image");
  }

  $imageUploadContainer.on("click", function (event) {
    if (event.target.closest(".upload-overlay")) {
      event.preventDefault(); // Prevents file picker from opening twice
      $profileImageInput.trigger("click");
    }
  });
});
