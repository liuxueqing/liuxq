/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for addUser
 */

$(document).ready(function () {
    var signupValidator = $("#addProjForm").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
                $(element).after(error);
        },
        errorElement: "span",
        rules: {
            ProjNum: {
                required: true,
                minlength: 8,
                maxlength: 8,
                remote: {  //验证Email是否存在
                    type: "POST",
                    url: "/user/configuration/projects/checkConfirm",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#ipt_ProjNum").val();
                        }
                    }
                }
            },
            ProjName: {
                required: true,
                minlength: 2
            }
        },
        messages: {
            ProjNum: {
                required: "项目编号不能为空!",
                minlength: "项目编号满 8 位， 请重新输入！",
                maxlength: "项目编号超过 8 位， 请检查输入！",
                remote: "项目编号已存在， 请重新输入！"
            },
            ProjName: {
                required: "用户名不能为空!",
                minlength: "用户名不能小于2个字符!"
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "/user/configuration/projects/addProj",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#addProjForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {
                    if (result == "true") {
                        $('#formInfoBox').find(".modal-body").html("项目新建成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href = "/user/configuration/projects"
                        })
                    }
                    if (result == "false") {
                        $('#formInfoBox').find(".modal-body").html("项目新建失败！");
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