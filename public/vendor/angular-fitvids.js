/**
 * @ngdoc directive
 * @name fitVids.directive:fitVids
 * @restrict A
 *
 * @version  0.1.0
 *
 * @description
 * Angular direYctive port of FitVids (http://fitvidsjs.com/).
 */

angular.module('fitVids', []).directive('fitVids', [function() {
    'use strict';

    if (!document.getElementById('fit-vids-style')) {
        var div = document.createElement('div');
        var ref = document.getElementsByTagName('base')[0] || document.getElementsByTagName('script')[0];
        var cssStyles = '&shy;<style>.fluid-width-video-wrapper{width:100%;position:relative;padding:0;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}</style>';
        div.className = 'fit-vids-style';
        div.id = 'fit-vids-style';
        div.style.display = 'none';
        div.innerHTML = cssStyles;
        ref.parentNode.insertBefore(div, ref);
    }

    return {
        restrict: 'A',
        link: function (scope, element, attr) {

            var selectors = [
                "iframe[src*='player.vimeo.com']",
                "iframe[src*='youtube.com']",
                "iframe[src*='youtube-nocookie.com']",
                "iframe[src*='kickstarter.com'][src*='video.html']",
                "object",
                "embed"
            ];

            var videos;

            if (attr.customSelector) {
                selectors.push(attr.customSelector);
            }

            videos = element[0].querySelectorAll(selectors.join(','));

            angular.forEach(videos, function (item) {

                var $item = angular.element(item);
                var height, width, aspectRatio;

                if (item.tagName.toLowerCase() === 'embed' &&
                        ($item.parent().tagName === 'object' && $item.parent().length) ||
                        $item.parent().hasClass('.fluid-width-video-wrapper')) {
                    return;
                }

                height = (item.tagName.toLowerCase() === 'object' || $item.attr('height')) ? parseInt($item.attr('height'), 10) : $item.height();
                width = !isNaN(parseInt($item.attr('width'), 10)) ? parseInt($item.attr('width'), 10) : $item.width();
                aspectRatio = height / width;

                if (!$item.attr('id')) {
                    var videoID = 'fitvid' + Math.floor(Math.random()*999999);
                    $item.attr('id', videoID);
                }

                $item.wrap('<div class="fluid-width-video-wrapper" />').parent().css('padding-top', (aspectRatio * 100) + "%");
                $item.removeAttr('height').removeAttr('width');

            });

        }
    };

}]);