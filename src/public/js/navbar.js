$(document).ready(function () {
  // Navbar scroll effect
  $(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
      $(".navbar").addClass("scrolled");
    } else {
      $(".navbar").removeClass("scrolled");
    }
  });

  // Set active link based on current page
  const currentPath = window.location.pathname;
  $(".nav-link").each(function () {
    if ($(this).attr("href") === currentPath) {
      $(this).addClass("active");
    }
  });

  // Mobile menu close on link click
  $(".nav-link").click(function () {
    $(".navbar-collapse").collapse("hide");
  });

  // Smooth scroll for anchor links
  $('a[href^="#"]').click(function (e) {
    e.preventDefault();
    const target = $(this.hash);
    if (target.length) {
      $("html, body").animate(
        {
          scrollTop: target.offset().top - 70,
        },
        500
      );
    }
  });
});
