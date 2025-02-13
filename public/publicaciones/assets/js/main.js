(function($) {
    'use strict';

//Toggle Nav for mobile  menu
    $('.menu-toggle').click(function(){
        $('.menu-wrapper').toggleClass('active-nav');
    });


    //Toggle Nav for mobile menu
$('.open_bar').click(function(){
    console.log('click');
$('nav').addClass('active-nav');
$('.menu-toggle').addClass('closee');
});

$('.close_bar').click(function(){
$('nav').removeClass('active-nav');
$('.menu-toggle').removeClass('closee');
});

$(document).ready(function(){
    $('.venobox').venobox(); 
});
    

    
// Loder / /
    $(function () {
      $('body').addClass('loaded');
    });


 // Mission brand
    $('.mission-brand-slider').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: false,
        nav: false,
        navText: ["<i class='fa fa-long-arrow-left''></i>", "<i class='fa fa-long-arrow-right''></i>"],
        responsive: {
            0: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 4
            },
            1000: {
                items: 4
            },
            1920: {
                items: 5
            }
        }
    })
      


    
	 // Slider Active
$('.slider_list').owlCarousel({
        loop: true,
        autoplay: false,
        autoplayTimeout: 10000,
        dots:true,
        nav: false,
        navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 1
            },
            1000: {
                items: 1
            },
            1920: {
                items: 1
            }
        }
    });	
     // Slider Active
   	    // counterUp
    $('.counter').counterUp({
        delay: 10,
        time: 1000
    });
   
     $('.testimonials_list').owlCarousel({
            loop: true,
            autoplay: true,
            autoplayTimeout: 10000,
            dots: false,
            nav: false,
            navText: ["<i class='fa fa-long-arrow-left''></i>", "<i class='fa fa-long-arrow-right''></i>"],
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 2
                },
                992: {
                    items: 2
                },
                1000: {
                    items: 2
                },
                1920: {
                    items: 3
                }
            }
        }); 


          $('.testimonials_list2').owlCarousel({
            loop: true,
            autoplay: true,
            autoplayTimeout: 10000,
            dots: true,
            nav: false,
            navText: ["<i class='fa fa-long-arrow-left''></i>", "<i class='fa fa-long-arrow-right''></i>"],
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 2
                },
                992: {
                    items: 2
                },
                1000: {
                    items: 2
                },
                1920: {
                    items: 3
                }
            }
        }); 

   
          $('.blog_list').owlCarousel({
            loop: true,
            autoplay: true,
            autoplayTimeout: 10000,
            dots: true,
            dotsEach:true,
            nav: true,
            navText: ["<i class='fas fa-long-arrow-alt-left''></i>", "<i class='fas fa-long-arrow-alt-right''></i>"],
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 2
                },
                992: {
                    items: 3
                },
                1000: {
                    items: 3
                },
                1920: {
                    items: 3
                }
            }
        });

        /* Portfolio Isotope  */
    $('.image_load').imagesLoaded(function() {

        if ($.fn.isotope) {

            var $portfolio = $('.image_load');

            $portfolio.isotope({

                itemSelector: '.grid-item',

                filter: '*',

                resizesContainer: true,

                layoutMode: 'masonry',

                transitionDuration: '0.8s'

            });
            $('.menu-filtering li').on('click', function() {

                $('.menu-filtering li').removeClass('current_menu_item');

                $(this).addClass('current_menu_item');

                var selector = $(this).attr('data-filter');

                $portfolio.isotope({

                    filter: selector,

                });

            });

        };

    });

      $('.brand_list').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: false,
        nav: false,
        navText: ["<i class='fa fa-long-arrow-left''></i>", "<i class='fa fa-long-arrow-right''></i>"],
        responsive: {
            320: {
                items: 2
            },
            768: {
                items: 3
            },
            992: {
                items: 4
            },
            1000: {
                items: 4
            },
			1500: {
                items: 5
            },
            1920: {
                items: 6
            }
        }
    }) 


      $('.brand_list2').owlCarousel({
        loop: true,
        autoplay: true,
        autoplayTimeout: 10000,
        dots: false,
        nav: false,
        navText: ["<i class='fa fa-long-arrow-left''></i>", "<i class='fa fa-long-arrow-right''></i>"],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 3
            },
            992: {
                items: 4
            },
            1000: {
                items: 4
            },
            1920: {
                items: 4
            }
        }
    })
      $('.case-list').owlCarousel({
            loop: true,
            autoplay: true,
            autoplayTimeout: 10000,
            dots: false,
            nav: false,
            navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 2
                },
                992: {
                    items: 2
                },
                1000: {
                    items: 2
                },
                1920: {
                    items: 3
                }
            }
        });
   

         $('.service-list').owlCarousel({
            loop: true,
            autoplay: true,
            autoplayTimeout: 10000,
            dots: true,
            dotsEach:true,
            nav: false,
            navText: ["<i class='fas fa-angle-left''></i>", "<i class='fas fa-angle-right''></i>"],
            responsive: {
                0: {
                    items: 1
                },
                768: {
                    items: 2
                },
                992: {
                    items: 2
                },
                1000: {
                    items: 3
                },
                1920: {
                    items: 3
                }
            }
        });
    
         //Header Search
    if($('.search-box-outer').length) {
        $('.search-box-outer').on('click', function() {
            $('body').addClass('search-active');
        });
        $('.close-search').on('click', function() {
            $('body').removeClass('search-active');
        });
    }


// sticky
    var wind = $(window);
    var sticky = $('#sticky-header');
    wind.on('scroll', function () {
        var scroll = wind.scrollTop();
        if (scroll < 100) {
            
            sticky.removeClass('sticky-nav');
        } else {
           sticky.addClass('sticky-nav');
           
        }
    });

// to top Jquery
$(window).scroll(function(){
if($(this).scrollTop() > 40){
$('#to-top').fadeIn();
} else{
$('#to-top').fadeOut();
}
})

$('.tilt-effect').tilt({
maxTilt: 20,
perspective: 1000, // Transform perspective, the lower the more extreme the tilt gets.
easing: "cubic-bezier(.03,.98,.52,.99)", // Easing on enter/exit.
scale: 1, // 2 = 200%, 1.5 = 150%, etc..
speed: 300, // Speed of the enter/exit transition.
transition: true, // Set a transition on enter/exit.
disableAxis: null, // What axis should be disabled. Can be X or Y.
reset: true, // If the tilt effect has to be reset on exit.
glare: false, // Enables glare effect
maxGlare: 1 // From 0 - 1.
});


$("#to-top").click(function(){
$('html , body').animate({scrollTop :0},800)
});

// to wow Jquery
new WOW().init();
    

     //======< scrollcue js >======
    // $(function(){
    //       scrollCue.init({
    //       duration : 1500,
    //       interval : -0.7,
    //       percentage : 0.90,
    //       smartSpeed: 500 
          
    //     })
    // });

    

	
})(jQuery);

 