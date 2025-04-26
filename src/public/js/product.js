document.addEventListener("DOMContentLoaded", function () {
  const productId = $("#productId").val();

  $("#product-delete-btn").on("click", async function () {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.post("/admin/product/delete", {
        productId: productId,
      });
      showNotification("Product deleted successfully", "success");
      window.location.href = "/admin/product/all";
    } catch (error) {
      console.error("Error:", error);
      showNotification("Error deleting product", "error");
    }
  });

  // Initialize all features
  const ProductManager = {
    init() {
      this.initCarousel();
      this.initProductHandlers();
      this.initVariantHandlers();
    },

    async updateProduct(data) {
      try {
        await axios.post("/admin/product/edit", data);
        showNotification("Product updated successfully", "success");
      } catch (error) {
        console.error("Error:", error);
        showNotification("Error updating product", "error");
      }
    },

    async updateVariant(data) {
      try {
        await axios.post("/admin/product-variant/edit", data);
        showNotification("Variant updated successfully", "success");
      } catch (error) {
        console.error("Error:", error);
        showNotification("Error updating variant", "error");
      }
    },

    initProductHandlers() {
      this.initStatusToggles();
      this.initDescriptionEditor();
    },

    initStatusToggles() {
      document.querySelectorAll(".product-status-toggle").forEach((toggle) => {
        toggle.addEventListener("change", () =>
          this.updateProduct({
            _id: productId,
            [toggle.getAttribute("data-field")]: toggle.checked,
          })
        );
      });
    },

    initDescriptionEditor() {
      const elements = {
        editBtn: document.getElementById("product-desc-edit-btn"),
        saveBtn: document.getElementById("product-desc-save-btn"),
        cancelBtn: document.getElementById("product-desc-cancel-btn"),
        displayEl: document.getElementById("product-desc-display"),
        editEl: document.getElementById("product-desc-edit-container"),
        textarea: document.getElementById("product-desc-textarea"),
      };

      if (!elements.editBtn || !elements.saveBtn || !elements.cancelBtn) return;

      elements.editBtn.addEventListener("click", () => {
        elements.displayEl.style.display = "none";
        elements.editEl.style.display = "block";
        elements.textarea.focus();
      });

      elements.saveBtn.addEventListener("click", () => {
        const newDesc = elements.textarea.value.trim();
        elements.displayEl.querySelector("p").textContent =
          newDesc || "No description available";
        elements.displayEl.style.display = "block";
        elements.editEl.style.display = "none";
        this.updateProduct({ _id: productId, productDesc: newDesc });
      });

      elements.cancelBtn.addEventListener("click", () => {
        const currentText = elements.displayEl.querySelector("p").textContent;
        elements.textarea.value =
          currentText === "No description available" ? "" : currentText;
        elements.displayEl.style.display = "block";
        elements.editEl.style.display = "none";
      });
    },

    initVariantHandlers() {
      const VariantManager = {
        elements: {
          $form: $("#addVariantForm"),
          $modal: $("#addVariantModal"),
          $submitBtn: $("#addVariantModal button[type='submit']"),
          $table: $(".variants-table tbody"),
          $noVariantsMsg: $(".no-variants-message"),
        },

        init() {
          this.initCreateVariant();
          this.initEditDeleteButtons();
        },

        initCreateVariant() {
          $("#create-variant-btn").on("click", () => {
            this.elements.$form[0].reset();
            this.elements.$modal.modal("show");
          });

          this.elements.$form.on("submit", this.handleVariantSubmit.bind(this));
        },

        async handleVariantSubmit(e) {
          e.preventDefault();
          if (this.elements.$submitBtn.prop("disabled")) return;

          const formData = getFormData($(this.elements.$form));
          const error = validateVariantData(formData);

          if (error) {
            showNotification(error, "error");
            return;
          }

          this.elements.$submitBtn.prop("disabled", true);
          try {
            const response = await axios.post(
              this.elements.$form.attr("action"),
              processFormData(formData)
            );

            this.addVariantToTable(response.data.productVariant);
            this.elements.$modal.modal("hide");
            this.elements.$form[0].reset();
            showNotification("Variant created successfully", "success");
          } catch (error) {
            console.error("Error:", error);
            showNotification(
              error.response?.data?.message || "Error creating variant",
              "error"
            );
          } finally {
            this.elements.$submitBtn.prop("disabled", false);
          }
        },

        addVariantToTable(variant) {
          const newRow = createVariantRow(variant);
          this.elements.$table.append(newRow);
          this.elements.$noVariantsMsg.hide();
        },

        initEditDeleteButtons() {
          // Using event delegation for edit and delete buttons
          this.elements.$table.on("click", ".btn-edit-variant", async (e) => {
            const $row = $(e.currentTarget).closest("tr");
            const $inputs = $row.find(".edit-input");
            const variantId = $row.data("variant-id");

            const data = {
              _id: variantId,
              size: $row
                .find('[data-field="size"] input')
                .val()
                .trim()
                .toUpperCase(),
              color: $row
                .find('[data-field="color"] input')
                .val()
                .trim()
                .toUpperCase(),
              stockQuantity: parseInt(
                $row.find('[data-field="stockQuantity"] input').val()
              ),
              productPrice: parseFloat(
                $row.find('[data-field="productPrice"] input').val()
              ),
              salePrice:
                parseFloat($row.find('[data-field="salePrice"] input').val()) ||
                null,
            };

            const error = validateVariantData(data);
            if (error) {
              showNotification(error, "error");
              return;
            }

            try {
              await ProductManager.updateVariant(data);
              // Update the input values to show uppercase
              $row.find('[data-field="size"] input').val(data.size);
              $row.find('[data-field="color"] input').val(data.color);
              $inputs.removeClass("modified");
            } catch (error) {
              console.error("Error updating variant:", error);
            }
          });

          this.elements.$table.on("click", ".btn-delete-variant", async (e) => {
            const $button = $(e.currentTarget);
            const $row = $button.closest("tr");
            const variantId = $row.data("variant-id");

            if (
              $button.prop("disabled") ||
              !confirm("Are you sure you want to delete this variant?")
            ) {
              return;
            }

            $button.prop("disabled", true);
            try {
              await axios.post("/admin/product-variant/delete", {
                id: variantId,
              });
              $row.fadeOut(() => {
                $row.remove();
                if (this.elements.$table.find("tr").length === 0) {
                  this.elements.$noVariantsMsg.show();
                }
              });
              showNotification("Variant deleted successfully", "success");
            } catch (error) {
              console.error("Error:", error);
              showNotification("Error deleting variant", "error");
              $button.prop("disabled", false);
            }
          });

          // Add change event listener to inputs
          this.elements.$table.on("change", ".edit-input", function () {
            $(this).addClass("modified");
          });
        },
      };

      VariantManager.init();
    },

    initCarousel() {
      const elements = {
        currentImage: document.getElementById("carousel-current-image"),
        prevBtn: document.getElementById("carousel-prev"),
        nextBtn: document.getElementById("carousel-next"),
        currentNumberEl: document.getElementById("carousel-current-number"),
        imageData: document.querySelectorAll(".carousel-image-data"),
      };

      if (!elements.currentImage || !elements.imageData.length) return;

      let currentIndex = 0;
      const maxIndex = elements.imageData.length - 1;
      const preloadedImages = [];

      // Preload all images
      const preloadImages = () => {
        elements.imageData.forEach((data, index) => {
          const img = new Image();
          img.src = data.getAttribute("data-src");
          preloadedImages[index] = img;
        });
      };
      preloadImages();

      const updateCarousel = () => {
        elements.currentImage.style.opacity = "0";
        setTimeout(() => {
          elements.currentImage.src =
            elements.imageData[currentIndex].getAttribute("data-src");
          if (elements.currentNumberEl) {
            elements.currentNumberEl.textContent = (
              currentIndex + 1
            ).toString();
          }
          elements.currentImage.style.opacity = "1";
        }, 150);
      };

      if (elements.prevBtn) {
        elements.prevBtn.addEventListener("click", () => {
          currentIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
          updateCarousel();
        });
      }

      if (elements.nextBtn) {
        elements.nextBtn.addEventListener("click", () => {
          currentIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
          updateCarousel();
        });
      }

      // Keyboard navigation
      document.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          currentIndex = currentIndex === 0 ? maxIndex : currentIndex - 1;
          updateCarousel();
        } else if (e.key === "ArrowRight") {
          currentIndex = currentIndex === maxIndex ? 0 : currentIndex + 1;
          updateCarousel();
        }
      });
    },
  };

  // Initialize the product manager
  ProductManager.init();
});

// Variant helper functions
function getFormData($form) {
  return $form.serializeArray().reduce((obj, item) => {
    obj[item.name] = item.value.trim();
    return obj;
  }, {});
}

function processFormData(data) {
  return {
    ...data,
    stockQuantity: parseInt(data.stockQuantity),
    productPrice: parseFloat(data.productPrice),
    salePrice: data.salePrice ? parseFloat(data.salePrice) : null,
  };
}

function validateVariantData(data) {
  if (!data.size) return "Size is required";
  if (!data.color) return "Color is required";
  if (!data.stockQuantity) return "Stock quantity is required";
  if (!data.productPrice) return "Price is required";

  if (isNaN(data.stockQuantity) || parseInt(data.stockQuantity) < 0) {
    return "Stock quantity must be a positive number";
  }

  if (isNaN(data.productPrice) || parseFloat(data.productPrice) <= 0) {
    return "Price must be greater than 0";
  }

  if (data.salePrice) {
    if (isNaN(data.salePrice) || parseFloat(data.salePrice) <= 0) {
      return "Sale price must be greater than 0";
    }
    if (parseFloat(data.salePrice) >= parseFloat(data.productPrice)) {
      return "Sale price must be less than regular price";
    }
  }

  if (!/^[A-Za-z0-9\s-]+$/.test(data.size)) {
    return "Size contains invalid characters";
  }

  if (!/^[A-Za-z\s-]+$/.test(data.color)) {
    return "Color should only contain letters, spaces, and hyphens";
  }

  return null;
}

// Helper function to create a new variant row
function createVariantRow(variant) {
  return `
    <tr data-variant-id="${variant._id}">
      <td class="editable-cell" data-field="size">
        <input type="text" class="form-control edit-input" value="${
          variant.size
        }"/>
      </td>
      <td class="editable-cell" data-field="color">
        <input type="text" class="form-control edit-input" value="${
          variant.color
        }"/>
      </td>
      <td class="editable-cell" data-field="stockQuantity">
        <input type="number" class="form-control edit-input" min="0" step="5" value="${
          variant.stockQuantity
        }"/>
      </td>
      <td class="editable-cell" data-field="productPrice">
        <input type="number" class="form-control edit-input" min="0" step="5" value="${
          variant.productPrice
        }"/>
      </td>
      <td class="editable-cell" data-field="salePrice">
        <input type="number" class="form-control edit-input" min="0" step="5" value="${
          variant.salePrice || ""
        }"/>
      </td>
      <td class="actions-cell">
        <button class="btn-edit-variant" title="Edit variant">
                  <i class="fas fa-save"></i>
        </button>
        <button class="btn-delete-variant" title="Delete variant">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `;
}

// Enhanced notification system
function showNotification(message, type) {
  const existingNotification = document.querySelector(".product-notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create icon based on type
  let icon;
  switch (type) {
    case "success":
      icon = "fas fa-check-circle";
      break;
    case "error":
      icon = "fas fa-exclamation-circle";
      break;
    case "info":
      icon = "fas fa-info-circle";
      break;
    default:
      icon = "fas fa-bell";
  }

  // Create notification
  const notification = document.createElement("div");
  notification.className = `product-notification ${type}`;
  notification.innerHTML = `
    <div class="product-notification-icon">
      <i class="${icon}"></i>
    </div>
    <div class="product-notification-message">${message}</div>
    <button class="product-notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Add to DOM
  document.body.appendChild(notification);

  // Add show class after a small delay (for animation)
  setTimeout(() => notification.classList.add("show"), 10);

  // Setup close button
  const closeBtn = notification.querySelector(".product-notification-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    });
  }

  // Auto-remove after delay
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
