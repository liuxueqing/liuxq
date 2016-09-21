/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for editUser
 */

$(document).ready(function () {
    var editUserValidator = $("#editUserForm").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
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
                    url: "/admin/user/checkEditConfirm",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#email").val();
                        }
                    }
                }
            },
            name: {
                required: true,
                minlength: 4
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
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "/admin/user/updateAccount",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#editUserForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {
                    if(result == "true") {
                        $('#formInfoBox').find(".modal-body").html("修改成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href="/admin/user"
                        })
                    }
                    if(result == "false") {
                        $('#formInfoBox').find(".modal-body").html("修改失败！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            editUserValidator.resetForm();
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