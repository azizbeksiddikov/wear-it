$(document).ready(function () {
  const $form = $("#memberForm");
  const $submitBtn = $form.find('button[type="submit"]');
  const userId = $('input[name="_id"]').val();

  // Get form data
  let formData = {
    _id: userId,
    memberFullName: $('input[name="memberFullName"]').val() || "",
    memberEmail: $('input[name="memberEmail"]').val() || "",
    memberPhone: $('input[name="memberPhone"]').val() || "",
    memberAddress: $('input[name="memberAddress"]').val() || "",
    memberDesc: $('textarea[name="memberDesc"]').val() || "",
  };

  // Form submission
  $form.on("submit", async function (e) {
    e.preventDefault();

    const phoneNum = formData.memberPhone.replace(/[^0-9]/g, "");
    if (!phoneNum || phoneNum.length < 11) {
      alert("Please enter a valid phone number (010-1234-5678)");
      return;
    }

    formData.memberFullName = $('input[name="memberFullName"]').val() || "";
    formData.memberEmail = $('input[name="memberEmail"]').val() || "";
    formData.memberAddress = $('input[name="memberAddress"]').val() || "";
    formData.memberDesc = $('textarea[name="memberDesc"]').val() || "";

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

    formData.memberPhone = value;
    $(this).val(value);
  });

  $(".member-status").on("change", function () {
    const selectedValue = $(this).val();

    $(this).attr("data-status", selectedValue);

    axios.post("/admin/user/edit", {
      _id: userId,
      memberStatus: selectedValue,
    });
  });

  $("#memberPoints").on("change", function () {
    const selectedValue = $(this).val();

    axios.post("/admin/user/edit", {
      _id: userId,
      memberPoints: selectedValue,
    });
  });
});
