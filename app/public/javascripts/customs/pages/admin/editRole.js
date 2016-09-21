/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for editRole
 */

$(document).ready(function () {
    var signupValidator = $("#addRoleForm").validate({
        errorPlacement: function (error, element) {
            // Append error within linked label
            console.log( $(element));
            $(element)
                .after(error)
        },
        errorElement: "span",
        rules: {
            name: {
                required: true,
                minlength: 4,
                remote: {  //验证Role name是否存在
                    type: "POST",
                    url: "/admin/role/checkEditConfirm",             //servlet
                    dataType: "json",           //接受数据格式
                    data: {
                        captcha: function () {
                            return $("#cname").val();
                        }
                    }
                }
            },
            description: {
                required: true,
                minlength: 4
            }
        },
        messages: {
            name: {
                required: "请输入角色名称",
                remote: "该角色名称已经存在，请重新输入"
            },
            description: {
                required: "请输入角色描述说明",
                minlength: "输入长度不够，请输入至少4个字符"
            }
        },
        invalidHandler: function () {
            return false;
        },
        submitHandler: function () {
            //表单的处理
            $.ajax({
                type: "POST",
                url: "/admin/role/editRole",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#addRoleForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {
                    if(result == "true") {
                        $('#formInfoBox').find(".modal-body").html("修改成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href="/admin/role"
                        })
                    }
                    if(result == "false") {
                        $('#formInfoBox').find(".modal-body").html("修改失败！");
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
        window.location.href="/admin/role"
    });
});