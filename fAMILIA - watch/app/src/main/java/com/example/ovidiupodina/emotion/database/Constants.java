package com.example.ovidiupodina.emotion.database;

public class Constants {
    public static final String BROADCAST_DATA = "BROADCAST_DATA";
    public static final String BROADCAST_STEPS = "BROADCAST_STEPS";
    public static final String BROADCAST_PULSE = "BROADCAST_PULSE";

    public static final String ANDROID_CHANNEL_ID = "FAMILIA_CHANNEL_ID";
    public static final String ANDROID_CHANNEL_NAME = "FAMILIA_CHANNEL_NAME";

    private static final String type = "dev"; // "dev" / ""
    private static final String BASE_URL = "https://gis" + type + ".indecosoft.net/chat/api";

    public static final String DATA_URL = BASE_URL + "/save-device-measurements";
    public static final String CONFIG_URL = BASE_URL + "/get-device-config/";
    public static final String NEW_ALERT_URL = BASE_URL + "/save-device-alerts";
    public static final String MISSED_ALERT_URL = BASE_URL + "/save-missed-device-alerts";

    // notification ids
    public static final int PULSE_NOTIFICATION_ID = 101;
    public static final int GEOFANCING_NOTIFICATION_ID = 102;
    public static final int BATTERY_LEVEL_NOTIFICATION_ID = 103;

    public static final String alertaZona = "iesireZonaPermisa";
    public static final String alertaPuls = "puls";

    public static final int PERMISSION_REQUEST_CODE = 100;
}
