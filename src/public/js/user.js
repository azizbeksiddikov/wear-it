$(document).ready(function () {
  const $form = $("#memberForm");
  const $blockBtn = $("#blockBtn");
  const $unblockBtn = $("#unblockBtn");
  const memberId = $form.find('input[name="_id"]').val();
  const $pointsInput = $("#memberPoints");
  let originalPoints = $pointsInput.val();

  // Form submission
  $form.on("submit", async function (e) {
    e.preventDefault();
    const $submitBtn = $(this).find('button[type="submit"]');
    if ($submitBtn.prop("disabled")) return;

    const formData = {
      _id: memberId,
      memberFullName: $('input[name="memberFullName"]').val().trim(),
      memberEmail: $('input[name="memberEmail"]').val().trim(),
      memberPhone: $('input[name="memberPhone"]').val().trim(),
      memberAddress: $('input[name="memberAddress"]').val().trim(),
      memberDesc: $('textarea[name="memberDesc"]').val().trim(),
      memberPoints: parseInt($("#memberPoints").val()),
    };

    // Remove empty fields
    Object.keys(formData).forEach(
      (key) => !formData[key] && key !== "_id" && delete formData[key]
    );

    $submitBtn.prop("disabled", true);
    try {
      await axios.post("/admin/user/edit", formData);
      showNotification("Member details updated successfully", "success");
    } catch (error) {
      console.error("Error:", error);
      showNotification(
        error.response?.data?.message || "Error updating member",
        "error"
      );
    } finally {
      $submitBtn.prop("disabled", false);
    }
  });

  // Points input handling
  $pointsInput.on("change", async function () {
    const newPoints = parseInt($(this).val());

    if (isNaN(newPoints) || newPoints < 0) {
      $(this).val(originalPoints);
      showNotification("Points must be a positive number", "error");
      return;
    }

    if (newPoints === parseInt(originalPoints)) return;

    try {
      await axios.post("/admin/user/edit", {
        _id: memberId,
        memberPoints: newPoints,
      });

      originalPoints = newPoints;
      showNotification("Member points updated successfully", "success");
    } catch (error) {
      console.error("Error:", error);
      $(this).val(originalPoints);
      showNotification("Error updating points", "error");
    }
  });

  // Helper functions
  function showNotification(message, type) {
    const $existing = $(".notification");
    if ($existing.length) $existing.remove();

    const $notification = $(`
      <div class="notification ${type}">
        <i class="fas fa-${
          type === "success" ? "check-circle" : "exclamation-circle"
        }"></i>
        ${message}
      </div>
    `).appendTo("body");

    setTimeout(() => {
      $notification.addClass("show");
      setTimeout(() => {
        $notification.removeClass("show");
        setTimeout(() => $notification.remove(), 300);
      }, 3000);
    }, 10);
  }

  // Member status management
  $("#blockBtn").on("click", async function () {
    if (!confirm("Are you sure you want to block this member?")) return;
    await updateMemberStatus(this, "BLOCKED");
  });

  $("#unblockBtn").on("click", async function () {
    if (!confirm("Are you sure you want to unblock this member?")) return;
    await updateMemberStatus(this, "ACTIVE");
  });

  $("#deleteBtn").on("click", async function () {
    if (
      !confirm(
        "Are you sure you want to delete this member? This action cannot be undone."
      )
    )
      return;
    await updateMemberStatus(this, "DELETED");
  });

  async function updateMemberStatus($btn, newStatus) {
    $btn = $($btn);
    $btn.prop("disabled", true);

    try {
      await axios.post("/admin/user/edit", {
        _id: memberId,
        memberStatus: newStatus,
      });

      showNotification(
        `Member ${newStatus.toLowerCase()} successfully`,
        "success"
      );
      setTimeout(() => location.reload(), 1500);
    } catch (error) {
      console.error("Error:", error);
      showNotification(
        error.response?.data?.message || `Error updating member status`,
        "error"
      );
      $btn.prop("disabled", false);
    }
  }

  // Remove old status change handler code
  $("#statusSelect")
    .on("change", async function () {
      const newStatus = $(this).val();
      const $select = $(this);

      if (
        !confirm(
          `Are you sure you want to change member status to ${newStatus}?`
        )
      ) {
        $select.val($select.data("original-value"));
        return;
      }

      $select.prop("disabled", true);
      try {
        await axios.post("/admin/user/edit", {
          _id: memberId,
          memberStatus: newStatus,
        });

        $select.data("original-value", newStatus);
        showNotification("Member status updated successfully", "success");

        // Update status indicator
        const $statusIndicator = $(".status-indicator");
        $statusIndicator
          .removeClass("active inactive blocked")
          .addClass(newStatus.toLowerCase());

        // Update status text
        $statusIndicator.next().text(newStatus);
      } catch (error) {
        console.error("Error:", error);
        $select.val($select.data("original-value"));
        showNotification(
          error.response?.data?.message || "Error updating status",
          "error"
        );
      } finally {
        $select.prop("disabled", false);
      }
    })
    .each(function () {
      // Store original value for cancellation
      $(this).data("original-value", $(this).val());
    });
});
