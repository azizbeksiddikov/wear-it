// Update user status
$(function () {
  $(".status-badge").on("change", function () {
    const $badge = $(this);
    const memberStatus = this.value;
    const userId = this._id;

    // Show loading state
    $badge.addClass("loading").css("opacity", "0.7");

    axios
      .post(`/admin/users/${userId}/status`, {
        memberStatus: memberStatus,
      })
      .then((response) => {
        if (response?.data?.data) {
          console.log("User updated successfully");
          // Visual feedback
          $badge.removeClass("loading").css("opacity", "");
          showToast("Success", "User status updated successfully", "success");
        } else {
          console.log(err);
          alert("User update failed");
        }
      })
      .finally(() => {
        $badge.removeClass("loading");
      });
  });

  // Handle points updates
  let pointsTimeout;
  $(".points-input").on("input", function () {
    const $input = $(this);
    const userId = $input.closest(".points-badge").attr("id");
    const points = parseInt($input.val());

    clearTimeout(pointsTimeout);

    // Debounce the update
    pointsTimeout = setTimeout(() => {
      axios
        .post(`/admin/users/${userId}/points`, {
          memberPoints: points,
        })
        .then((response) => {
          if (response.data.success) {
            showToast("Success", "Points updated successfully");
          }
        })
        .catch((error) => {
          console.error("Error updating points:", error);
          showToast("Error", "Failed to update points", "error");
          // Revert to original value
          $input.val(prevPoints);
        });
    }, 500);
  });

  // Search functionality
  $(".search-box input").on(
    "input",
    debounce(function () {
      const query = $(this).val().toLowerCase();
      $("tbody tr").each(function () {
        const $row = $(this);
        const name = $row.find(".user-name").text().toLowerCase();
        const email = $row.find(".user-email").text().toLowerCase();

        if (name.includes(query) || email.includes(query)) {
          $row.show();
        } else {
          $row.hide();
        }
      });
    }, 300)
  );
});

// Utility function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Toast notification function
function showToast(title, message, type = "success") {
  // Implement your toast notification logic here
  console.log(`${title}: ${message}`);
}
