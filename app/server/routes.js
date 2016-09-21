var AM = require('./modules/account-manager');
var RP = require('./modules/role-pemission');
var LM = require('./modules/log-manager');
var SM = require('./modules/site-manager');

var _ = require("underscore")._;
var svgCaptcha = require('svg-captcha');
var fs = require('fs');
var parser = require('ua-parser-js');
var path = require('path');
var moment = require('moment');
moment.locale('zh-cn');

/* ********************************************** 初始化数据 **************************************************** */
var leftNavDatas = {};

//拼接站点数据json
SM.splicingMajorData(function (err, Projs) {
    var ProjLen = Projs.length;
    Projs.forEach(function (Proj, ProjIndex) {
        //获取该项目名称
        var ProjNum = Proj.ProjNum;
        SM.getAllSiteInfoByProjNum(ProjNum, function (err, sites) {
            Proj.sites = sites;
            var siteLen = sites.length;
            sites.forEach(function (site, siteIndex) {
                var SiteID = site.ID;
                SM.getAllDeviceInfoBySiteID(SiteID, function (err, devices) {
                    site.devices = devices;
                    if (ProjIndex == (ProjLen - 1) && siteIndex == (siteLen - 1)) {
                        //循环结束执行后续操作
                        SM.updateMajorDatas(Projs, function (e, o) {
                            if (e) console.log(e);
                        })
                    }
                })
            })
        })
    });
});///拼接站点数据json - /End

var topNavData = [
    {
        "NavName": "音频监听",
        "link": "/user/monitor/"
    },
    {
        "NavName": "地图主页",
        "link": "/user/map"
    },
    {
        "NavName": "报警列表",
        "link": "/user/alert"
    },
    {
        "NavName": "音频测试",
        "link": "/user/audioTest"
    },
    {
        "NavName": "websocket测试",
        "link": "/user/stest"
    }
];

/* ********************************************** 权限设置 **************************************************** */

//登陆鉴权
var auth = function (req, res, next) {
    if (req.session.user) {
        next()
    } else {
        console.log("用户未登陆");
        res.redirect('/login');
    }
};

//页面权限
var pageAuthority = function (req, res, next) {
    var routePath = req.route.path;
    if (req.session.user.Role) {
        try {
            var permissions = req.session.user.Role.permissions;
            //判断某个数组对象是否含有 指定attr: val，没有返回-1， 找到返回index下标
            function findElem(arrayToSearch, attr, val) {
                for (var i = 0; i < arrayToSearch.length; i++) {
                    if (arrayToSearch[i][attr] == val) {
                        return i;
                    }
                }
                return -1;
            }

            var hasPageAuthority = findElem(permissions, "pageAuthority", routePath);
            if (hasPageAuthority == -1) {
                console.log("用户没有权限访问此网页");
                res.redirect('/error-unauthorized');
            } else {
                next();
            }
        } catch (err) {
            console.log(err)
        }
    } else {
        res.render('error-unauthorized.html', {
            title: '用户角色未分配！',
            topNavData: [],
            udata: req.session.user
        })
    }
};

//数据权限
//////////

//获取客户端IP
function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}

module.exports = function (app) {
    /*!
     * 平台业务路由
     * 2016/8/29编辑
     * 刘伟
     *
     * 包含页面级路由和数据级路由（API）
     */

    /* ******************************************** 数据API ************************************************ */

    /**
     * 路由说明： 登陆的数据API
     * 鉴权说明： 无鉴权
     * method: POST
     */
    app.post('/login', function (req, res) {
        var user = req.body['user'];
        var pass = req.body['pass'];
        // get user-agent header
        var ua = parser(req.headers['user-agent']);
        // get use ip address
        var ip = getClientIp(req);
        AM.manualLogin(user, pass, function (e, o) {
            if (!o) {
                LM.addLog({
                    "type": "login",
                    "name": "登陆日志",
                    "user": user,
                    "IP": ip,
                    "role": "未登录",
                    "result": {
                        "state": "false",
                        "msg": "用户名或密码错误!"
                    },
                    "ua": ua
                });
                res.status(400).send({"msg": "用户名或密码错误!"});
                res.end();
            } else {
                req.session.user = o;
                if (req.body['remember-me'] == 'on') {
                    res.cookie('user', o.user, {maxAge: 3600 * 24 * 7});
                    res.cookie('pass', o.pass, {maxAge: 3600 * 24 * 7});
                    //获取权限
                    RP.getPemissionByUser(req.session.user, function (result) {
                        req.session.user.Role = result[0];
                        LM.addLog({
                            "type": "login",
                            "name": "登陆日志",
                            "user": user,
                            "IP": ip,
                            "role": req.session.user.Role.name,
                            "result": {
                                "state": "true",
                                "msg": "登陆成功!"
                            },
                            "ua": ua
                        });
                        //获取站点信息
                        res.status(200).send({"msg": "登录成功！"});
                    });
                } else {
                    //获取权限
                    RP.getPemissionByUser(req.session.user, function (result) {
                        req.session.user.Role = result[0];
                        LM.addLog({
                            "type": "login",
                            "name": "登陆日志",
                            "user": user,
                            "IP": ip,
                            "role": req.session.user.Role.name,
                            "result": {
                                "state": "true",
                                "msg": "登陆成功!"
                            },
                            "ua": ua
                        });
                        //获取站点信息

                        res.status(200).send({"msg": "登录成功！"});
                    });
                }
            }
        });
    });

    /**
     * 路由说明： 登陆时的svg验证码后台数据API
     * 鉴权说明： 无校验
     * method: post
     */
    app.post('/captcha', function (req, res) {
        var iptCaptchaTest = req.body['captcha'].toUpperCase();
        var currentCaptchaTest = req.session.captcha.toUpperCase();
        if (iptCaptchaTest == currentCaptchaTest) {
            res.write("true");
            res.end()
        } else {
            res.write("false");
            res.end()
        }
    });

    /**
     * 路由说明： 获得用户列表的数据API
     * 鉴权说明： 登陆校验
     * method: get
     */
    app.get('/admin/user/getAllRecords', auth, function (req, res, next) {
        AM.getAllRecords(function (err, result) {
            res.json(result);
            res.end();
        })
    });

    /**
     * 路由说明： 获取登陆日志列表的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/log/login/getAllRecords', auth, function (req, res) {
        var page = req.body['page'];   //页码
        var rows = req.body['rows'];   //行数
        var sidx = req.body['sidx'];            //排序关键字
        var sord = (function () {                 //排序方式
            if (req.body['sord'] == 'asc') {
                return 1
            } else if (req.body['sord'] == 'desc') {
                return -1
            }
        })();
        LM.getLoginLogByPagination({
            page: page,
            rows: rows,
            sidx: sidx,
            sord: sord
        }, function (result) {
            res.json(result);
        })
    });

    /**
     * 路由说明： 获取操作日志列表的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/log/operation/getAllRecords', auth, function (req, res) {
        var page = req.body['page'];   //页码
        var rows = req.body['rows'];   //行数
        var sidx = req.body['sidx'];            //排序关键字
        var sord = (function () {                 //排序方式
            if (req.body['sord'] == 'asc') {
                return 1
            } else if (req.body['sord'] == 'desc') {
                return -1
            }
        })();
        LM.getOperationLogByPagination({
            page: page,
            rows: rows,
            sidx: sidx,
            sord: sord
        }, function (result) {
            res.json(result);
        })
    });


    /**
     * 路由说明： 新建用户数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/user/addUser', auth, function (req, res) {
        var email = req.body['email'];
        var user = email;
        var name = req.body['name'];
        var pass = req.body['pass'];
        var creator = req.session.user.user;
        var roleId = req.body['role'];
        // get user-agent header
        var ua = parser(req.headers['user-agent']);
        // get use ip address
        var ip = getClientIp(req);
        //查找获得对应角色的ObjectId
        RP.getRoleResourceByRoleId(roleId, function (o) {
            if (!o) {
                console.log("数据库中无该角色!")
            } else {
                //添加新用户并设置角色
                AM.addNewAccount({
                    name: name,
                    email: email,
                    user: user,
                    pass: pass,
                    creator: creator,
                    role: o.name,
                    pid: o._id
                }, function (e) {
                    if (e) {
                        res.json("false");
                        res.end();
                    } else {
                        LM.addLog({
                            "type": "operation",
                            "name": "操作日志",
                            "user": req.session.user.user,
                            "IP": ip,
                            "role": req.session.user.role,
                            "result": {
                                "state": "true",
                                "msg": "[" + creator + "]新建了帐号[" + user + "], 并设置了角色[" + o.name + "]"
                            },
                            "ua": ua
                        });
                        res.json("true");
                        res.end();
                    }
                });
            }
        });
    });

    /**
     * 路由说明： 修改用户密码的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/user/updatePassword', auth, function (req, res) {
        var email = req.body['email'];
        var password = req.body['password'];
        var pass = req.body['pass'];
        // get user-agent header
        var ua = parser(req.headers['user-agent']);
        // get use ip address
        var ip = getClientIp(req);
        if (password == pass) {
            AM.updatePassword(email, pass, function () {
                LM.addLog({
                    "type": "operation",
                    "name": "操作日志",
                    "user": req.session.user.user,
                    "IP": ip,
                    "role": req.session.user.role,
                    "result": {
                        "state": "true",
                        "msg": "[" + req.session.user.user + "]修改了[" + email + "]的密码!"
                    },
                    "ua": ua
                })
                res.json("true");
                res.end();
            })
        } else {
            res.json("2次密码不一致!");
        }
    });

    /**
     * 路由说明： 检查用户帐号是否存在的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/user/checkConfirm', auth, function (req, res) {
        AM.getAccountByEmail(req.body['email'], function (o) {
            if (o) {
                res.write("false");
                res.end()
            } else {
                res.write("true");
                res.end()
            }
        });
    });

    /**
     * 路由说明： 在编辑时，检查用户帐号是否存在（可以填写相同的帐号）的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/user/checkEditConfirm', auth, function (req, res) {
        var initialAccount = req.session.user.initialAccount;
        AM.getAccountByEmailAndInitialAccount(req.body['email'], initialAccount.email, function (o) {
            if (o) {
                res.write("false");
                res.end()
            } else {
                res.write("true");
                res.end()
            }
        });
    });

    /**
     * 路由说明： 删除用户帐号数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/user/:_id/del', auth, function (req, res) {
        var oper = req.body['oper'];
        var _id = req.params._id;
        // get user-agent header
        var ua = parser(req.headers['user-agent']);
        // get use ip address
        var ip = getClientIp(req);
        if (oper == 'del') {
            AM.getUserInfoById(_id, function (err, result) {
                //进行删除操作
                AM.deleteAccount(_id, function (e) {
                    LM.addLog({
                        "type": "operation",
                        "name": "操作日志",
                        "user": req.session.user.user,
                        "IP": ip,
                        "role": req.session.user.role,
                        "result": {
                            "state": "true",
                            "msg": "[" + req.session.user.user + "]删除了_id为[" + _id + "]的账号"
                        },
                        "ua": ua
                    });
                    res.status(200).json("true");
                    res.end();
                })
            })
        }
        else {
            res.status(400).json("false");
        }
    });

    /**
     * 路由说明： 删除角色信息数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/role/:_id/del', auth, function (req, res) {
        var oper = req.body['oper'];
        var _id = req.params._id;
        // get user-agent header
        var ua = parser(req.headers['user-agent']);
        // get use ip address
        var ip = getClientIp(req);
        if (oper == 'del') {
            RP.getRoleResourceByRoleId(_id, function (o) {
                //进行删除操作
                RP.deleteRole(_id, function (e) {
                    LM.addLog({
                        "type": "operation",
                        "name": "操作日志",
                        "user": req.session.user.user,
                        "IP": ip,
                        "role": req.session.user.role,
                        "result": {
                            "state": "true",
                            "msg": "[" + req.session.user.user + "]删除了_id为[" + _id + "]的角色"
                        },
                        "ua": ua
                    });
                    res.status(200).json("true");
                    res.end();
                })
            });
        }
        else {
            res.status(400).json("false");
        }
    });

    /**
     * 路由说明： 编辑更新用户帐号信息的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/user/updateAccount', auth, function (req, res) {
        var email = req.body['email'];
        var user = email;
        var name = req.body['name'];
        var roleId = req.body['role'];
        // get user-agent header
        var ua = parser(req.headers['user-agent']);
        // get use ip address
        var ip = getClientIp(req);
        var _id = req.session.user.initialAccount._id;
        //查找获得对应角色的ObjectId
        RP.getRoleResourceByRoleId(roleId, function (o) {
            if (!o) {
                console.log("数据库中无该角色!")
            } else {
                //console.log(o)
                //编辑用户并设置角色
                AM.updateAccount({
                    _id: _id,
                    name: name,
                    email: email,
                    user: user,
                    role: o.name,
                    pid: o._id
                }, function (e) {
                    if (e) {
                        res.json("false");
                        res.end();
                    } else {
                        LM.addLog({
                            "type": "operation",
                            "name": "操作日志",
                            "user": req.session.user.user,
                            "IP": ip,
                            "role": req.session.user.role,
                            "result": {
                                "state": "true",
                                "msg": "[" + req.session.user.user + "]编辑了_id为[" + _id + "]的账号"
                            },
                            "ua": ua
                        });
                        res.json("true");
                        res.end();
                    }
                });
            }
        });
    });

    /**
     * 路由说明： 获取所有角色信息的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.get('/admin/role/getAllRecords', auth, function (req, res) {
        RP.getAllRecords(function (err, result) {
            res.json(result);
            res.end();
        })
    });

    /**
     * 路由说明： 新建角色的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/role/addRole', auth, function (req, res) {
        var selected_permissions = null;//页面选择的权限集合
        var name = req.body['name'];
        var creator = req.session.user.user;
        var description = req.body['description'];
        // get user-agent header
        var ua = parser(req.headers['user-agent']);
        // get use ip address
        var ip = getClientIp(req);
        //判断传入的手选权限是否为数组
        var duallistbox_permissions = (function () {
            if (_.isArray(req.body['duallistbox_permissions'])) {
                return req.body['duallistbox_permissions']
            } else {
                return (function () {
                    var tempArr = new Array();
                    tempArr.push(req.body['duallistbox_permissions']);
                    return tempArr
                })()
            }
        })();
        RP.getSellectedAccessAndResource(duallistbox_permissions, function (err, result) {
            if (err) console.log(err);
            selected_permissions = result;  //将用户选择设置的权限信息查找出来， 一同写入新建角色的数据库中
            //新建角色
            RP.addRole({
                name: name,
                creator: creator,
                description: description,
                permissions: selected_permissions
            }, function (err) {
                if (err) {
                    console.log(err);
                    res.json("false");
                    res.end()
                } else {
                    LM.addLog({
                        "type": "operation",
                        "name": "操作日志",
                        "user": req.session.user.user,
                        "IP": ip,
                        "role": req.session.user.role,
                        "result": {
                            "state": "true",
                            "msg": "[" + req.session.user.user + "]新建了角色[" + name + "]"
                        },
                        "ua": ua
                    });
                    res.json("true");
                    res.end()
                }
            })
        });
    });

    /**
     * 路由说明： 当编辑角色的时候，检查角色名称是否重复（可以是原帐号）的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/role/checkEditConfirm', auth, function (req, res) {
        var initialRoleName = req.session.user.initialRole.name;
        RP.getRoleResourceByRoleNameAndInitialRoleName(req.body['name'], initialRoleName, function (o) {
            if (o) {
                res.write("false");
                res.end()
            } else {
                res.write("true");
                res.end()
            }
        });
    });

    /**
     * 路由说明： 编辑角色信息的数据API
     * 鉴权说明： 登陆校验
     * method: post
     */
    app.post('/admin/role/editRole', auth, function (req, res) {
        var selected_permissions = null;//页面选择的权限集合
        var name = req.body['name'];
        var creator = req.session.user.user;
        var description = req.body['description'];
        // get user-agent header
        var ua = parser(req.headers['user-agent']);
        // get use ip address
        var ip = getClientIp(req);
        //判断传入的手选权限是否为数组
        var duallistbox_permissions = (function () {
            if (_.isArray(req.body['duallistbox_permissions'])) {
                return req.body['duallistbox_permissions']
            } else {
                return (function () {
                    var tempArr = new Array();
                    tempArr.push(req.body['duallistbox_permissions']);
                    return tempArr
                })()
            }
        })();
        RP.getSellectedAccessAndResource(duallistbox_permissions, function (err, result) {
            if (err) console.log(err);

            selected_permissions = result;  //将用户选择设置的权限信息查找出来， 一同写入新建角色的数据库中
            //更新角色
            RP.updateRole({
                _id: req.session.user.initialRole._id,
                name: name,
                creator: creator,
                description: description,
                permissions: selected_permissions
            }, function (err) {
                if (err) {
                    console.log(err);
                    res.json("false");
                    res.end()
                } else {
                    LM.addLog({
                        "type": "operation",
                        "name": "操作日志",
                        "user": req.session.user.user,
                        "IP": ip,
                        "role": req.session.user.role,
                        "result": {
                            "state": "true",
                            "msg": "[" + req.session.user.user + "]编辑了_id为[" + req.session.user.initialRole._id + "]的角色"
                        },
                        "ua": ua
                    });
                    res.json("true");
                    res.end()
                }
            })
        });
    });

    /**
     * 路由说明： 地图主页
     * 鉴权说明： 登陆校验
     * method: POST
     */
    app.post('/api/maps/getAllSiteInfo', auth, function (req, res) {
        SM.getAllSiteInfo(function (err, result) {
            if (err) {
                res.json("false");
                res.end()
            } else {
                res.json(result);
                res.end()
            }
        })
    });

    /* ********************************************** 页面级路由 **************************************************** */
    /**
     * 路由说明： 主页路径跳转路由
     * 鉴权说明： 登陆校验
     * method: GET
     */
    app.get('/', auth, function (req, res) {
        res.redirect('/menu');
    });

    /**
     * 路由说明： 监控页面主路径跳转路由
     * 鉴权说明： 登陆校验
     * method: GET
     */
    app.get('/user/monitor/', auth, function (req, res) {
        SM.findLeftNavDatas(function (e) {
            leftNavDatas = e;
            res.redirect('/user/monitor/' + leftNavDatas[0].ProjNum + '/all');
        });
    });

    /**
     * 路由说明： 登陆页面
     * 鉴权说明： 登陆校验
     * method: GET
     */
    app.get('/login', function (req, res) {
        if (req.session.user == null) {
            // if user is not logged-in redirect back to login page //
            res.render('./application/login.html', {
                title: '山西-吉兆 -- 平台登录',
                udata: req.session.user
            });

        } else {
            res.redirect('/menu');
        }
    });

    /**
     * 路由说明： 站点导航
     * 鉴权说明： 登陆校验, 页面访问权限校验
     * method: GET
     */
    app.get('/menu', auth, pageAuthority, function (req, res) {
        res.render('./application/menu.html', {
            title: '山西-吉兆 -- 导航菜单',
            udata: req.session.user
        });
    });

    /**
     * 路由说明： 监控主页 - 站点总览
     * 鉴权说明： 登陆校验, 页面访问权限校验
     * method: GET
     */
    app.get('/user/monitor/:ProjectID/all', auth, pageAuthority, function (req, res, next) {


        //查询初始化信息
        SM.findLeftNavDatas(function (e) {
            var leftNavDatas = e;
            if (!req.session.user) {
                // if user is not logged-in redirect back to login page //
                res.redirect('/login');
            } else {
                var currentProjectID = req.params.ProjectID;
                var currentSiteID = "all";
                SM.findDataByProIdAndSiteId(currentProjectID, currentSiteID, function (o) {
                    res.render('./application/index-siteView.html', {
                        title: '山西-吉兆 -- 监控主页',
                        currentProjectID: currentProjectID,
                        currentSiteID: currentSiteID,
                        leftNavDatas: leftNavDatas,
                        mainDatas: o,
                        topNavData: topNavData,
                        udata: req.session.user
                    });
                });
            }
        });
    });

/**
 * 路由说明： 监控主页 - 设备总览
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: GET
 */
app.get('/user/monitor/:ProjectID/:SiteID', auth, pageAuthority, function (req, res, next) {


    //查询初始化信息
    SM.findLeftNavDatas(function (e) {
        var leftNavDatas = e;
        if (!req.session.user) {
            // if user is not logged-in redirect back to login page //
            res.redirect('/login');
        } else {
            var currentProjectID = req.params.ProjectID;
            var currentSiteID = req.params.SiteID;
            SM.findDataByProIdAndSiteId(currentProjectID, currentSiteID, function (o) {
                res.render('./application/index-deviceView.html', {
                    title: '山西-吉兆 -- 监控主页',
                    currentProjectID: currentProjectID,
                    currentSiteID: currentSiteID,
                    leftNavDatas: leftNavDatas,
                    mainDatas: o,
                    topNavData: topNavData,
                    udata: req.session.user
                });
            });
        }
    });
});

/**
 * 路由说明： 地图主页
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: GET
 */
app.get('/user/map', auth, pageAuthority, function (req, res, next) {
    res.render('./application/map', {
        title: '山西-吉兆 -- 监控主页',
        udata: req.session.user,
        topNavData: topNavData
    });
});

/**
 * 路由说明： 登出平台
 * 鉴权说明： 无校验
 * method: GET
 */
app.get('/logout', function (req, res) {
    // get user-agent header
    var ua = parser(req.headers['user-agent']);
    // get use ip address
    var ip = getClientIp(req);
    LM.addLog({
        "type": "login",
        "name": "登陆日志",
        "user": req.session.user.user,
        "IP": ip,
        "role": req.session.user.Role.name,
        "result": {
            "state": "true",
            "msg": "退出平台!"
        },
        "ua": ua
    });
    res.clearCookie('user');
    res.clearCookie('pass');
    req.session.user = null;
    req.session.destroy(function (e) {
        res.redirect('/');
    });
});


/**
 * 路由说明： 登陆时的svg验证码
 * 鉴权说明： 无校验
 * method: GET
 */
app.get('/captcha', function (req, res) {
    var text = svgCaptcha.randomText();
    var captcha = svgCaptcha(text);
    req.session.captcha = text;
    res.set('Content-Type', 'image/svg+xml');
    res.status(200).send(captcha);
});


/**
 * 路由说明： 后台管理首页
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: GET
 */
app.get('/admin', auth, pageAuthority, function (req, res) {
    var dashboardInfo = {};
    AM.getAllRecords(function (e, a) {
        dashboardInfo.userNum = a.length;

        RP.getAllRecords(function (e, b) {
            dashboardInfo.roleNum = b.length

            LM.getAllRecords(function (e, c) {
                dashboardInfo.logNum = c.length

                res.render('./admin/index', {
                    title: "山西-吉兆 -- 管理首页",
                    udata: req.session.user,
                    dashboardInfo: dashboardInfo
                });
            })
        })
    });
});

/**
 * 路由说明： 用户管理
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: GET
 */
app.get('/admin/user', auth, pageAuthority, function (req, res) {
    res.render('./admin/user', {
        title: "山西-吉兆 -- 用户管理",
        udata: req.session.user
    });
});

/**
 * 路由说明： 新建用户页面
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: GET
 */
app.get('/admin/user/addUser', pageAuthority, function (req, res) {
    //获取角色列表
    RP.getAllRecordsName(function (err, result) {
        if (err) {
            console.log(err)
        } else {
            res.render('./admin/addUser', {
                title: "山西-吉兆 -- 新建用户",
                udata: req.session.user,
                roleList: result
            });
        }
    })
});

/**
 * 路由说明： 编辑用户信息页面
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: get
 */
app.get('/admin/user/:_id/edit', auth, pageAuthority, function (req, res) {
    var _id = req.params._id;       //获得需要编辑的用户id
    //获取角色列表
    RP.getAllRecordsName(function (err, result) {
        var roleList = result;
        var temp = {};
        //获取该用户信息
        AM.getUserInfoById(_id, function (err, o) {
            req.session.user.initialAccount = o;   //保存待编辑账号Email
            for (var i = 0; i < roleList.length; i++) {
                if (roleList[i].name == o.role) {
                    temp = roleList[i];
                    roleList.splice(i, 1)
                }
            }
            //将用户已有的角色放置到下拉选框的顶部
            roleList.unshift(temp);
            res.render('./admin/editUser', {
                title: "山西-吉兆 -- 编辑用户",
                udata: req.session.user,
                roleList: roleList,
                accountInfo: o
            });
        });
    });
});

/**
 * 路由说明： 修改用户密码页面
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: get
 */
app.get('/admin/user/:_id/modify', auth, pageAuthority, function (req, res) {
    var _id = req.params._id;
    //获取该用户信息
    AM.getUserInfoById(_id, function (err, o) {
        res.render('./admin/modifyPassword', {
            title: "山西-吉兆 -- 修改密码",
            udata: req.session.user,
            accountInfo: o
        });
    });
});

/**
 * 路由说明： 角色管理页面
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: get
 */
app.get('/admin/role', auth, pageAuthority, function (req, res) {
    res.render('./admin/role', {
        title: "山西-吉兆 -- 角色管理",
        udata: req.session.user
    });
});

/**
 * 路由说明： 新建角色的页面
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: get
 */
app.get('/admin/role/addRole', auth, pageAuthority, function (req, res) {
    RP.getAllAccessAndResource(function (err, AllAccessAndResource) {
        if (err) {
            console.log(err);
        } else {
            res.render('./admin/addRole', {
                title: "山西-吉兆 -- 新建角色",
                udata: req.session.user,
                AllAccessAndResource: AllAccessAndResource
            });
        }
    });
});

/**
 * 路由说明： 角色信息编辑页面
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: get
 */
app.get('/admin/role/:_id/edit', auth, pageAuthority, function (req, res) {
    var _id = req.params._id;
    RP.getAllAccessAndResource(function (err, AllAccessAndResource) {
        if (err) {
            console.log(err);
        } else {
            RP.getAccessAndResourceById(_id, function (err, o) {
                req.session.user.initialRole = o[0];   //保存待编辑Role信息
                var filter = AllAccessAndResource;
                var hasRole = o[0].permissions;
                var c1 = _.map(filter, function (data, key) {
                    return JSON.stringify(data)
                });
                var c2 = _.map(hasRole, function (data, key) {
                    return JSON.stringify(data)
                });
                var ref = _.difference(c1, c2);

                var AllAccessAndResourceWithoutSelect = _.map(ref, function (data, key) {
                    return JSON.parse(data)
                });
                //console.log(AllAccessAndResourceWithoutSelect);
                res.render('./admin/editRole', {
                    title: "山西-吉兆 -- 编辑角色",
                    udata: req.session.user,
                    AllAccessAndResource: AllAccessAndResourceWithoutSelect,
                    selectRoleInfo: o[0]
                });
            });
        }
    });
});

/**
 * 路由说明： 登录日志页面
 * 鉴权说明： 登陆校验，页面访问权限校验
 * method: get
 */
app.get('/admin/log/login', auth, pageAuthority, function (req, res) {
    res.render('./admin/log-login.html', {
        title: "山西-吉兆 -- 登陆日志管理",
        udata: req.session.user
    });
});

/**
 * 路由说明： 日志管理页面
 * 鉴权说明： 登陆校验，页面访问权限校验
 * method: get
 */
app.get('/admin/log/operation', auth, pageAuthority, function (req, res) {
    res.render('./admin/log-operation.html', {
        title: "山西-吉兆 -- 日志管理管理",
        udata: req.session.user
    });
});

/**
 * 路由说明： 音频测试页面
 * 鉴权说明： 登陆校验, 页面访问权限校验
 * method: GET
 */
app.get('/user/audioTest', auth, pageAuthority, function (req, res) {
    res.render('./application/audioTest', {
        title: "山西-吉兆 -- 音频测试",
        udata: req.session.user,
        topNavData: topNavData
    });
});

/**
 * 路由说明： 设置页面
 * 鉴权说明： 登陆校验，页面访问权限校验
 * method: get
 */
app.get('/admin/setting', auth, pageAuthority, function (req, res) {
    res.render('./admin/setting', {
        title: "山西-吉兆 -- 设置",
        udata: req.session.user
    });
});

/**
 * 路由说明： error unauthorized 用户帐号无权限的提示页面
 * 鉴权说明： 登陆校验
 * method: get
 */
app.get('/error-unauthorized', auth, function (req, res) {
    res.render('error-unauthorized.html', {
        title: '山西-吉兆 -- 权限错误',
        topNavData: topNavData,
        udata: req.session.user
    })
});

/**
 * 路由说明： error 404 提示页面
 * 鉴权说明： 登陆校验
 * method: get
 */
app.get('*', function (req, res) {
    res.render('error-404.html', {
        title: '山西-吉兆 -- 404',
        topNavData: topNavData,
        udata: req.session.user
    })
});


/* ******************************************** 其他 ************************************************ */

// password reset //

//app.post('/lost-password', function (req, res) {
//    // look up the user's account via their email //
//    AM.getAccountByEmail(req.body['email'], function (o) {
//        if (o) {
//            EM.dispatchResetPasswordLink(o, function (e, m) {
//                // this callback takes a moment to return //
//                // TODO add an ajax loader to give user feedback //
//                if (!e) {
//                    res.status(200).send('ok');
//                } else {
//                    for (k in e) console.log('ERROR : ', k, e[k]);
//                    res.status(400).send('unable to dispatch password reset');
//                }
//            });
//        } else {
//            res.status(400).send('email-not-found');
//        }
//    });
//});

//app.get('/reset-password', function (req, res) {
//    var email = req.query["e"];
//    var passH = req.query["p"];
//    AM.validateResetLink(email, passH, function (e) {
//        if (e != 'ok') {
//            res.redirect('/');
//        } else {
//            // save the user's email in a session instead of sending to the client //
//            req.session.reset = {email: email, passHash: passH};
//            res.render('reset', {title: 'Reset Password'});
//        }
//    })
//});

//app.post('/reset-password', function (req, res) {
//    var nPass = req.body['pass'];
//    // retrieve the user's email from the session to lookup their account and reset password //
//    var email = req.session.reset.email;
//    // destory the session immediately after retrieving the stored email //
//    req.session.destroy();
//    AM.updatePassword(email, nPass, function (e, o) {
//        if (o) {
//            res.status(200).send('ok');
//        } else {
//            res.status(400).send('unable to update password');
//        }
//    })
//});

// view & delete accounts //

//app.get('/print', function (req, res) {
//    AM.getAllRecords(function (e, accounts) {
//        res.render('print', {title: 'Account List', accts: accounts});
//    })
//});
//
//app.get('/reset', function (req, res) {
//    AM.delAllRecords(function () {
//        res.redirect('/print');
//    });
//});
}
;