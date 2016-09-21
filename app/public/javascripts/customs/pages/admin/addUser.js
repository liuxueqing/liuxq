/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for addUser
 */

$(document).ready(function () {
    var signupValidator = $("#signupForm").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
            console.log( $(element))
            $(element)
                .after(error)
        },
        errorElement: "span",
        rules: {
            email: {
                required: true,
                email: true,
                remote: {  //验证Email是否存在
                    type: "POST",
                    url: "/admin/user/checkConfirm",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#cemail").val();
                        }
                    }
                }
            },
            name: {
                required: true,
                minlength: 4
            },
            password: {
                required: true,
                minlength: 6
            },
            pass: {
                required: true,
                minlength: 6,
                equalTo: "#password"
            }
        },
        messages: {
            email: {
                required: "Email地址不能为空",
                remote: "Email地址已经存在，请重新输入"
            },
            name: {
                required: "用户名不能为空",
                minlength: "用户名不能小于6个字符"
            },
            password: {
                required: "请输入密码",
                minlength: "确认密码不能小于6个字符"
            },
            pass: {
                required: "请输入确认密码",
                minlength: "确认密码不能小于6个字符",
                equalTo: "两次输入密码不一致不一致"
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "/admin/user/addUser",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#signupForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {
                    if(result == "true") {
                        $('#formInfoBox').find(".modal-body").html("用户新建成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href="/admin/user"
                        })
                    }
                    if(result == "false") {
                        $('#formInfoBox').find(".modal-body").html("用户新建失败！");
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