$(function() {
    $(".alert-fixed").on("click", function() {
        // Remove query params but stay on current page
        window.history.pushState(undefined, undefined, window.location.pathname);
        $(this).slideUp(200);
        setTimeout(() => {
            $(this).remove();
        }, 200);
    });
});
