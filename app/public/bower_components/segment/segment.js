//此插件只能产生2 和 3个下拉选项。其他数目的按钮 请更新代码。
(function ($) {
    $.fn.extend({
        Segment: function () {
            $(this).each(function () {
                var self = $(this);
                var opItems = $(this).find("option").length;
                if (opItems == 2) {
                    var wrapper2 = $("<div>", { class: "ui-segment ui-segment-2" });
                    $(this).find("option").each(function () {
                        var option = $("<span>", { class: 'option', text: $(this).text(), value: $(this).val() });
                        if ($(this).is(":selected")) {
                            option.addClass("active");
                        }
                        wrapper2.append(option);
                    });
                    wrapper2.find("span.option").click(function () {
                        wrapper2.find("span.option").removeClass("active");
                        $(this).addClass("active");
                        self.val($(this).attr('value'));
                    });
                    $(this).after(wrapper2);
                    $(this).hide();
                }
                if (opItems == 3) {
                    var wrapper3 = $("<div>", { class: "ui-segment ui-segment-3" });
                    $(this).find("option").each(function () {
                        var option = $("<span>", { class: 'option', text: $(this).text(), value: $(this).val() });
                        if ($(this).is(":selected")) {
                            option.addClass("active");
                        }
                        wrapper3.append(option);
                    });
                    wrapper3.find("span.option").click(function () {
                        wrapper3.find("span.option").removeClass("active");
                        $(this).addClass("active");
                        self.val($(this).attr('value'));
                    });
                    $(this).after(wrapper3);
                    $(this).hide();
                }
            });
        }
    });
})(jQuery);
