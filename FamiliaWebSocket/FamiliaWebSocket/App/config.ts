export const config = {
    db: {
        host: '192.168.100.52',
        database: 'gisdb',
        user: 'postgres',
        password: 'postgres',
        port: '5432'
    },
    configTransporter: {
        host: 'mail.indecosoft.ro',
        port: 465,
        secure: true,
        auth: {
            user: 'familia@indecosoft.ro',
            pass: 'wAS18S0W98g84is'
        },
        tls: {
            rejectUnauthorized: false
        }
    },
    mailOptions: {
        from: '<familia@indecosoft.ro>',
        to: '',
        subject: 'Password reset!',
        html: ''
    },
    socketError: {
        error: 'Error',
        message: 'Connection error!'
    },
    dataType: {
        bloodPressure: 'bloodPressure',
        bloodGlucose: 'bloodGlucose',
        smartband: 'smartBand'
    },
    serverUrl: 'https://gisdev.indecosoft.net/chat/',
    secretKey: '401b09eab3c013d4ca5492b0090fb922bb802bec8fd5318192b092b0090fb090fb92b0090fb337592b0090fb992b0090fb1abd3e44453b954592b0090fb55b7a0812e1081c39b740293f765eae731f5a65ed137591abd3e44453b954555b7a0812e1081c39b740293f765eae731f5a65ed15f201d8b3727429090fb337591abd3e44453b954555b7a0812e1081c39b740293f765eae731f5a65ed1',
    cryptoKey: '9vApxLk5G3PAsJrM'
}