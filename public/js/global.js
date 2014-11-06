(function ($) {

    var showing = false,
        headerToggleHeight = 290,
        logoSmallScale     = 0.35;

    $(window).on('scroll', function (e) {

        var top = jQuery(window).scrollTop(),
        progress = Math.min(1, top / headerToggleHeight),
        scale = 1 - (1 - logoSmallScale) * progress,
            logo = $('.hero .logo');

        if(!showing && top > headerToggleHeight) {
            $('.main-header').removeClass('hiding-header');
            logo.addClass('hiding-logo');
            showing = true;
        } else if(showing && top < headerToggleHeight) {
            showing = false;
            $('.main-header').addClass('hiding-header');
            logo.removeClass('hiding-logo');
        }


        logo.css({
            transform:'scale(' + scale + ')'
        });

    });

    $(document).on('ready', function () {




    });


}(jQuery));