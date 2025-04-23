$(document).ready(function () {
  const $form = $("#memberForm");
  const $submitBtn = $form.find('button[type="submit"]');

  // Form submission
  $form.on("submit", async function (e) {
    e.preventDefault();

    // Get form data
    const formData = {
      _id: $('input[name="_id"]').val(),
      memberStatus: $(".member-status").val(),
      memberPoints: parseInt($("#memberPoints").val()) || 0,
      memberFullName: $('input[name="memberFullName"]').val() || "",
      memberEmail: $('input[name="memberEmail"]').val() || "",
      memberPhone: $('input[name="memberPhone"]').val() || "",
      memberAddress: $('input[name="memberAddress"]').val() || "",
      memberDesc: $('textarea[name="memberDesc"]').val() || "",
    };

    const phoneNum = formData.memberPhone.replace(/[^0-9]/g, "");
    if (!phoneNum || phoneNum.length < 10) {
      alert("Please enter a valid phone number (010-1234-5678)");
      return;
    }

    // Show loading state
    $submitBtn.prop("disabled", true).text("Saving...");

    try {
      // Send data to server
      await axios.post("/admin/user/edit", formData);

      alert("Member information saved successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save member information. Please try again.");
    } finally {
      $submitBtn.prop("disabled", false).text("Save Changes");
    }
  });

  // Handle Phone formatting
  $('input[name="memberPhone"]').on("input", function () {
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
});
