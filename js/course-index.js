$(function () {

    // 屏幕分界值751px
    var cutoffValue = 751;

    // 屏幕适配(min-width: cutoffValue px)
    if ($(window).width() > cutoffValue) {
        $("html").css("font-size", "50px");
    }

    // 媒体对象的实例化对象
    var player;

    // 画中画
    var requestPictureInPictureLoading = false;

    // 图文详情、课程目录的点击事件
    $("#containerNav").on("click", "li", function() {
        var _this = $(this);
        var index = _this.index();
        _this.addClass("nav-cur").siblings().removeClass("nav-cur");
        $("#swiper .swiper-slide").eq(index).removeClass("hide").scrollTop(0).siblings().addClass("hide");
    });

    // 指定初次视频在视频列表中的位置
    var modiaOrder = $("#mediaCatalog li.media-active").index();

    // 根据媒体对象生成实例化对象
    function initMedia() {
        $("title").html(nowMedia.title);
        $(".audio-error").text("").hide();
        player && player.off();
        var mediaBox = $("#videoAudioBox");
        if (nowMedia.type == 1) {
            var getTpl = $("#videoTpl").html();
            laytpl(getTpl).render(nowMedia, function(html) {
                mediaBox.html(html);
            });

            player = $("#video");
            player.on("play", function() {
                $("#mediaCatalog li").eq(modiaOrder).removeClass("media-noActive");
            }).on("ended", function() {
                $("#mediaCatalog li").eq(modiaOrder).addClass("media-noActive");
            });
            $("#mediaSrc").on("error", function(){
                layer.open({ content: '视频加载失败，您可以查看图文详情。', skin: 'msg', time: 2 });
            });

            if(!OS.phone){
                var video = player[0];
                $(window).on("scroll", function() {
                    if($(window).scrollTop() > 250){
                        console.log(123456)
                        if(!requestPictureInPictureLoading){
                            try {
                                if (video !== document.pictureInPictureElement) {
                                    // 尝试进入画中画模式
                                    video.requestPictureInPicture();
                                    requestPictureInPictureLoading = true;
                                }
                            } catch(error) {
                                log('出错了！' + error);
                            }
                        }
                    }
                });
                video.addEventListener('enterpictureinpicture', function(event) {
                    requestPictureInPictureLoading = false;
                });
            }
        } else {
            var getTpl = $("#audioTpl").html();
            laytpl(getTpl).render(nowMedia, function(html) {
                mediaBox.html(html);
            });

            // 音频初始化
            player = $('#player');
            player.on("play", function() {
                $("#mediaCatalog li").eq(modiaOrder).removeClass("media-noActive");
                audioPlay();
            }).on("pause", function () {
                audioPause();
            }).on("ended", function() {
                $("#mediaCatalog li").eq(modiaOrder).addClass("media-noActive");
            });
            $("#mediaSrc").on("error", function(){
                layer.open({ content: '音频加载失败，您可以查看图文详情。', skin: 'msg', time: 2 });
            });
            player[0].onwaiting = function () {
                $(".audio-mask-loading").show();
            };
            player[0].onplaying = function () {
                $(".audio-mask-loading").hide();
            };
        }
        // updatePlayCount();
    }
    initMedia();

    // 播放的时候需要将courseId对应的播放次数加1
    // function updatePlayCount() {
    //     $.ajax({
    //         url: "/course/updateCoursePlayCount",
    //         type: "POST",
    //         dataType: "json",
    //         data: {
    //             courseID: nowMedia.courseId
    //         },
    //         success: function (data) {
    //             if (data.isok) {
    //                 //console.log("success");
    //                 $(".img-text-detail[data-id='" + nowMedia.courseId + "']").find(".see-count-number").text(data.playCount);
    //             }
    //         },
    //         error: function () {
    //             //console.log("error");
    //         }
    //     });
    // }

    // 音频播放底图换位动态图
    function audioPlay() {
        $("#audioPoster").fadeOut("1000");
        $("#audioImg").attr("src", "images/audio-bg.gif").fadeIn("1000");
    }

    // 音频暂停底图换位静态图
    function audioPause() {
        $("#audioImg").attr("src", "images/audio-bg.png");
    }

    // 仅移动端执行横竖屏切换
    if(OS.phone){
        var screenDirection = window.matchMedia("(orientation: portrait)");
        screenDirection.addListener(handleOrientationChange);
        handleOrientationChange(screenDirection);

        function handleOrientationChange(screenDirection) {
            if (screenDirection.matches) {
                $("#wrapperBox").removeClass("landscape").addClass("portrait");
            } else {
                $("#wrapperBox").removeClass("portrait").addClass("landscape");
            }
        }

        $(window).on("resize", function() {
            handleOrientationChange(screenDirection);
        });
    }
    

    // 切换视频/音频
    $("#mediaCatalog").on("click", "li", function() {
        var _this = $(this);
        var mediaType = _this.attr("data-type");
        var mediaUrl = _this.attr("data-mediaUrl");
        var mediaPoster = _this.attr("data-mediaPoster");
        var mediaTitle = _this.attr("data-title");
        var courseId = _this.attr("data-id");
        var nowCourseId = $("#mediaSrc").attr("data-id");
        if (courseId == nowCourseId) {
            return false;
        } else {
            $(window).off("scroll");
            document.exitPictureInPicture();
            modiaOrder = _this.index();
            $("#mediaSrc").attr("src", mediaUrl);

            // 将上一个音视频的实例摧毁
            player.remove();
            // 更新当前播放的媒体对象
            nowMedia = {
                type: mediaType,
                src: mediaUrl,
                poster: mediaPoster,
                title: mediaTitle,
                courseId: courseId
            }
            initMedia();
            player[0].play();
            _this.addClass("media-active").siblings().removeClass("media-active");

            // 展示相应的图文信息
            $(".img-text-detail[data-id='" + courseId + "']").removeClass("hide").siblings().addClass("hide");
        }
    });

    // 生成二维码参数
    var optionQrcard = {
        render: 'canvas',
        text: "",
        minVersion: 3,
        radius: 3,
        quiet: 3,
        mode: 0,
        size: 120
    };

    function createUrlQrcode(id, url) {
        optionQrcard.text = url;
        $(id).empty().qrcode(optionQrcard);
    }

    // 在桌面的情况下显示二维码，移动端直接跳转至mo.fooww.com
    if (!OS.phone) {
        $("#openInApp").removeAttr("href");
        var qrcodeWrapper = $("#qrcodeWrapper");
        var qrcodeBox = $("#qrcodeBox");
        var qrcodeUrl;
        $("#openInApp").hover(
            function () {
                // 二维码链接的处理
                qrcodeUrl = location.origin + "/course/detail/" + $("#mediaCatalog li.media-active").attr("data-id");
                createUrlQrcode("#qrcodeBox", qrcodeUrl);
                qrcodeWrapper.show();
            },
            function () {
                qrcodeBox.empty();
                qrcodeWrapper.hide();
            }
        );
    } else {
        $("#openInApp").attr("href", "http://mo.fooww.com/");
    }
})