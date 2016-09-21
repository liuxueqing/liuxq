/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for login
 */

//图形验证码
$(document).ready(function () {
    //iframe里的元素为动态加载，绑定的click事件会丢失，所以需要循环绑定
    setInterval(aa, 1000);

    function aa() {
        $("#loginIframe").contents().on("click", function (e) {
            $("#loginIframe").attr('src', $("#loginIframe").attr('src'));
        });
    }
});

$(document).ready(function () {
    var signupValidator = $("#signinForm").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
            console.log( $(element));
            $(element)
                .after(error);
        },
        errorElement: 'li',
        rules: {
            user: {
                required: true,
                email: true
            },
            pass: {
                required: true,
                minlength: 6
            },
            captcha: {
                required: true,
                remote: {  //验证captcha是否正确
                    type: "POST",
                    url: "captcha",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#captcha").val();
                        }
                    }
                }
            }
        },
        messages: {
            user: {
                required: "用户名不能为空",
                email: "请输入正确的邮箱帐号"
            },
            pass: {
                required: "请输入确认密码",
                minlength: "确认密码不能小于6个字符",
            },
            captcha: {
                required: "请输入右侧验证码",
                remote: "验证码不正确"
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "login",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#signinForm").serialize(),
                error: function (data) {
                    var msg = JSON.parse(data.responseText)
                    $('#formInfoBox').find(".modal-body").html(msg.msg);
                    $('#formInfoBox').modal();
                    $('#formInfoBox').on('hidden.bs.modal', function (e) {
                        window.location.href="/login"
                    })
                },
                success: function (result) {
                    window.location.href="/menu"
                }
            });
            return false;//阻止表单提交
        }
    });
});