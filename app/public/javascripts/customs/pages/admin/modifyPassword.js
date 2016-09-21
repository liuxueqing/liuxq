/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for modifyPassword
 */

$(document).ready(function () {
    var signupValidator = $("#updatePassword").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
            $(element)
                .after(error)
        },
        errorElement: "span",
        rules: {
            email: {
                required: true
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
                required: "Email地址不能为空"
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
                url: "/admin/user/updatePassword",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#updatePassword").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {

                    console.log(result);

                    if(result == "true") {
                        $('#formInfoBox').find(".modal-body").html("密码修改成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href="/admin/user"
                        })
                    }
                    if(result == "false") {
                        $('#formInfoBox').find(".modal-body").html("密码修改成功失败！");
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

    $("#editCancel").click(function () {
        window.location.href="/admin/user"
    });
});