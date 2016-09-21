/**
 * Created by Liuwei on 2016/8/18.
 */
/**
 * form js for addRole
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
                minlength: 4
            },
            description: {
                required: true,
                minlength: 4
            }
        },
        messages: {
            name: {
                required: "请输入角色名称"
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
                url: "/admin/role/addRole",             //servlet
                dataType: "json",           //接受数据格式
                data: $("#addRoleForm").serialize(),
                error: function (err) {
                    alert(err)
                },
                success: function (result) {

                    console.log(result)

                    if(result == "true") {
                        $('#formInfoBox').find(".modal-body").html("角色新建成功！");
                        $('#formInfoBox').modal();
                        $('#formInfoBox').on('hidden.bs.modal', function (e) {
                            window.location.href="/admin/role"
                        })
                    }
                    if(result == "false") {
                        $('#formInfoBox').find(".modal-body").html("角色新建失败！");
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