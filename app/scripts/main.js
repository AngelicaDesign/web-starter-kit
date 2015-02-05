/* global $: false */

(function () {
  'use strict';

  $(document).ready(function () {

    // Make to-top button appear when user scrolls past a certain point
    window.addEventListener('scroll', function () {
      $('.to-top-button').toggleClass('hide', window.scrollY < window.innerHeight/2);
    });

    // Enable sticky nav on all except home page because on that
    // page we have it disappear until user scroll down.
    if ($('.home-page').length) {
      window.addEventListener('scroll', function () {
        $('.nav').toggle(window.scrollY > $('.header').outerHeight() - $('.nav').outerHeight());
      });
    } else {
      $('.nav').sticky();
    }

    // Scroll to top when thi button is clicked
    $('a.to-top-button').click(function () {
      $('html, body').animate({ scrollTop: 0 }, 'slow');
      return false;
    });

    // Make contact link in nav trigger hiding and showing the contact page
    $('a.contact-link').attr('href', '#');
    $('a.contact-link').click(function () {
      $('.contact-page').toggleClass('hide');
      $('body').toggleClass('no-scroll');
      $('.nav').toggleClass('force-show');
      $('.contact-link').toggleClass('active');
      return false;
    });

  });

})();
