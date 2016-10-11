/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for addUser
 */

$(document).ready(function () {
    var signupValidator = $("#addSiteForm").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
            console.log($(element))
            $(element)
                .after(error)
        },
        errorElement: "span",
        rules: {
            SiteNum: {
                required: true,
                minlength: 8,
                maxlength: 8,
                remote: {  //验证Email是否存在
                    type: "POST",
                    url: "/user/configuration/sites/checkSiteNum",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#ipt_SiteNum").val();
                        }
                    }
                }
            },
            SiteName: {
                required: true,
                minlength: 2,
                remote: {  //验证SiteName是否存在
                    type: "POST",
                    url: "/user/configuration/sites/checkSiteName",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#ipt_SiteName").val();
                        }
                    }
                }
            },
            ContactMobile: {
                required: false
            },
            ContactTel: {
                required: false
            },
            ContactEmail: {
                required: false
            },
            OHNotes: {
                required: false
            }
        },
        messages: {
            SiteNum: {
                required: "站点编号不能为空",
                minlength: "站点编号满 8 位， 请重新输入!",
                maxlength: "站点编号超过 8 位， 请检查输入!",
                remote: "站点编号已存在， 请重新输入！"
            },
            SiteName: {
                required: "站点名称不能为空!",
                minlength: "站点名称不能小于2个字符!",
                remote: "站点名称已存在， 请重新输入！"
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "/user/configuration/sites/addSite",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#addSiteForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {
                    if (result == "true") {
                        $('#formInfoBox').find(".modal-body").html("站点新建成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href = "/user/configuration/sites"
                        })
                    }
                    if (result == "false") {
                        $('#formInfoBox').find(".modal-body").html("站点新建失败！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            signupValidator.resetForm();
                        })
                    }
                }
            });
            return false;//阻止表单提交
        }
    });

    $("#signupReset").click(function () {
        signupValidator.resetForm();
    });
});


$(document).ready(function () {
    generateRandom();
    function generateRandom() {
        var num = Math.floor(Math.random() * 100000000);
        var str = String(num);
        while (str.length < 8) {
            str = str + "0";
        }
        $("#ipt_SiteNum").val(str)
    }

    $(".btn-reset").on("click", function () {
        generateRandom();
    })
});