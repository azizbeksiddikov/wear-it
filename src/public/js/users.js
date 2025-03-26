$(function () {
  $(".users-status-select").on("change", function () {
    const memberStatus = this.value,
      id = this.id;

    // Update data-status attribute immediately for visual feedback
    $(this).attr("data-status", memberStatus);

    axios
      .post("/admin/user/edit", {
        _id: id,
        memberStatus: memberStatus,
      })
      .then((response) => {
        if (response?.data?.data) {
          $(this).blur();
        } else {
          alert("User status update failed");
          // Revert data-status if update failed
          $(this).attr(
            "data-status",
            $(this).find("option:selected").attr("selected") ? "ACTIVE" : ""
          );
        }
      })
      .catch((err) => {
        console.log(err);
        alert("User update failed");
        // Revert data-status if update failed
        $(this).attr(
          "data-status",
          $(this).find("option:selected").attr("selected") ? "ACTIVE" : ""
        );
      });
  });
});
