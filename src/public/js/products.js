$(function () {
  // Handle product status changes
  $(".product-status-select").on("change", function () {
    const isActive = this.value === "true",
      id = this.id;

    // Update data-status attribute immediately for visual feedback
    $(this).attr("data-status", this.value);

    axios
      .post("/admin/product/edit", {
        _id: id,
        isActive: isActive,
      })
      .then((response) => {
        console.log("Successfully updated product status");
        if (response?.data?.product) {
          $(this).blur();
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Product update failed");
        // Revert data-status if update failed
        const originalStatus = $(this).find("option:not(:selected)").val();
        $(this).attr("data-status", originalStatus);
        $(this).val(originalStatus);
      });
  });

  // Handle featured status changes
  $("input[id^='featured-']").on("change", function () {
    const isFeatured = this.checked,
      id = this.id.replace("featured-", "");

    axios
      .post("/admin/product/edit", {
        _id: id,
        isFeatured: isFeatured,
      })
      .then((response) => {
        console.log("Successfully updated product featured status");
        if (response?.data?.product) {
          $(this).blur();
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Product update failed");
        // Revert checkbox state if update failed
        this.checked = !isFeatured;
      });
  });

  // Handle sale status changes
  $("input[id^='sale-']").on("change", function () {
    const onSale = this.checked,
      id = this.id.replace("sale-", "");

    axios
      .post("/admin/product/edit", {
        _id: id,
        onSale: onSale,
      })
      .then((response) => {
        console.log("Successfully updated product sale status");
        if (response?.data?.product) {
          $(this).blur();
        }
      })
      .catch((err) => {
        console.log(err);
        alert("Product update failed");
        // Revert checkbox state if update failed
        this.checked = !onSale;
      });
  });

  // Handle create product button click - show modal
  $("#create-product-btn, #create-product-empty").on("click", function () {
    $(".create-product").addClass("active");
    $("body").css("overflow", "hidden"); // Prevent scrolling of background
  });

  // Close form when clicking the close button or cancel button
  $(".btn-close-form, .btn-cancel").on("click", function () {
    closeCreateForm();
  });

  // Close the form when clicking outside of it
  $(".create-product").on("click", function (e) {
    if ($(e.target).hasClass("create-product")) closeCreateForm();
  });

  // Handle image uploads with preview
  $(".image-input").on("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      const previewId = this.id.replace("image-upload-", "preview-");

      reader.onload = function (e) {
        const preview = $("#" + previewId);
        preview.attr("src", e.target.result);
        preview.addClass("active");
      };

      reader.readAsDataURL(file);
    }
  });
});

// Form validation function called on form submission
function validateProductForm() {
  // Basic validation for required fields
  if (!$("#productName").val()) {
    alert("Please enter a product name.");
    return false;
  }

  if (!$("#productCategory").val()) {
    alert("Please select a product category.");
    return false;
  }

  if (!$("#productGender").val()) {
    alert("Please select a product gender.");
    return false;
  }

  // Check if at least one image is uploaded
  const hasImage = Array.from(document.querySelectorAll(".image-input")).some(
    (input) => input.files.length > 0
  );

  if (!hasImage) {
    alert("Please upload at least one product image.");
    return false;
  }

  // Count uploaded images
  const imageCount = Array.from(
    document.querySelectorAll(".image-input")
  ).filter((input) => input.files.length > 0).length;

  if (imageCount > 10) {
    alert("You can upload a maximum of 10 images.");
    return false;
  }

  // Show loading state
  $(".btn-submit").prop("disabled", true).text("Creating...");

  // Return true to allow form submission
  return true;
}

function closeCreateForm() {
  $(".create-product").removeClass("active");
  $("body").css("overflow", "auto"); // Restore scrolling
  $("#create-product-form")[0].reset(); // Reset form
  $(".image-preview").removeClass("active"); // Reset image previews
}
