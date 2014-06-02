(function($) {
  return $.fn.nearBottom = function(options) {
    var checkScrollPosition, defaults;
    defaults = {
      pixelsFromBottom: 100,
      delay: 250,
      callback: function() {
        return false;
      }
    };
    options = $.extend(defaults, options);
    return (checkScrollPosition = function() {
      var documentHeight, enqueueNextCheck, nearBottom, pixelsToBottom, scrollHeight, scrollable, windowHeight;
      documentHeight = $(document).height();
      scrollHeight = $(document).scrollTop();
      windowHeight = $(window).height();
      pixelsToBottom = documentHeight - scrollHeight - windowHeight;
      scrollable = function() {
        return documentHeight > windowHeight;
      };
      nearBottom = function() {
        return pixelsToBottom <= options.pixelsFromBottom;
      };
      enqueueNextCheck = function(delay) {
        return setTimeout(checkScrollPosition, delay);
      };
      if (scrollable() && nearBottom()) {
        if (options.callback() === true) {
          return enqueueNextCheck(options.delay);
        }
      } else {
        return enqueueNextCheck(options.delay);
      }
    })();
  };
})(jQuery);
