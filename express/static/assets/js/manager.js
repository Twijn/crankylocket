$(function() {
    $(".alert-fixed").on("click", function() {
        window.history.pushState(undefined, undefined, "/");
        $(this).slideUp(200);
        setTimeout(() => {
            $(this).remove();
        }, 200);
    });
});
