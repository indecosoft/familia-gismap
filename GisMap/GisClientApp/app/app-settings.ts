module Gis {
    'use strict';
    export 
        class AppSettings {
        ////nu face modificari
        public static readonly adminUserAuth = 3;
        public static readonly anonimUser = "anonim";
        public static readonly anonimPass = "1234";

        public static readonly serverPath = '';

        public static readonly whiteListedDomains = [
            '82.208.144.183',
            'localhost',
            'indecosoft.net',
        ]
    }

}