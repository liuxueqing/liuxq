/**
 * Created by Liuwei on 2016/8/15.
 */
module.exports = {
    port: 3000,
    mongodb: {
        dbName: "shanxi",
        dbHost: "192.168.1.9",
        dbPort: 27017
    },
    email: {
        host 	    : process.env.EMAIL_HOST || 'smtp.gmail.com',
        user 	    : process.env.EMAIL_USER || 'your-email-address@gmail.com',
        password    : process.env.EMAIL_PASS || '1234',
    }
};
