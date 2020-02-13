package com.example.ovidiupodina.emotion.services;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.PowerManager;
import android.preference.PreferenceManager;
import android.support.annotation.Nullable;
import android.support.v4.app.ActivityCompat;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.widget.Toast;

import com.example.ovidiupodina.emotion.database.Constants;
import com.example.ovidiupodina.emotion.R;
import com.example.ovidiupodina.emotion.data.Storage;
import com.example.ovidiupodina.emotion.database.DatabaseHelper;
import com.example.ovidiupodina.emotion.geofacing.Punct;
import com.example.ovidiupodina.emotion.storage.Database;
import com.example.ovidiupodina.emotion.tasks.alerts.AlertTask;
import com.example.ovidiupodina.emotion.tasks.alerts.IAlertTask;
import com.example.ovidiupodina.emotion.tasks.configApp.ConfigAppTask;
import com.example.ovidiupodina.emotion.tasks.configApp.IConfigApp;
import com.example.ovidiupodina.emotion.tasks.missedAlerts.IMissedAlerta;
import com.example.ovidiupodina.emotion.tasks.missedAlerts.MissedAlerts;
import com.example.ovidiupodina.emotion.tasks.sendData.SendDataTask;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.TimeUnit;

import com.example.ovidiupodina.emotion.tasks.sendData.ISendDataListener;

import static com.example.ovidiupodina.emotion.database.Constants.alertaPuls;
import static com.example.ovidiupodina.emotion.database.Constants.alertaZona;

public class MainService extends Service implements LocationListener, SensorEventListener, ISendDataListener, IConfigApp, IAlertTask, IMissedAlerta {

    private Sensor pulseSensor;
    private Sensor accelerometerSensor;

    private SensorManager sensorManager;

    private LocationManager locationManager;

    private int contorValAcc = 0;

    private float pulse = -1;
    private float steps;
    private float auxSteps = 0;
    private float mAccel = 0;
    private float mAccelCurrent = 0;

    private double longitude;
    private double latitude;

    private boolean gps = false;
    private boolean sendPanicAlerts = false;

    private Timer locationTimer;
    private Timer dataTimer;
    private Timer pulseTimer;
    private Timer writeTimer;

    private Handler locationHandler;
    private Handler dataHandler;
    private Handler pulseHandler;
    private Handler writeHandler;

    private NotificationManager notificationManager;
    private SimpleDateFormat dateFormat;
    private PowerManager.WakeLock wl;


    // config
    private String IMEI = null;
    //private List<String> numbers;

    BroadcastReceiver dataReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                publishPulse();
                publishSteps();
            }
        }
    };

    BroadcastReceiver chargerReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();

            if (action != null && action.equals(Intent.ACTION_POWER_CONNECTED)) {
                Toast.makeText(context, "Power connected!", Toast.LENGTH_SHORT).show();
                new ConfigAppTask(MainService.this).execute(Constants.CONFIG_URL + IMEI);
                sendAlerts();
            }

            if (action != null && action.equals(Intent.ACTION_POWER_DISCONNECTED)) {
                Toast.makeText(context, "Power disconnected!", Toast.LENGTH_SHORT).show();
            }
        }
    };

    @SuppressLint({"WakelockTimeout", "InvalidWakeLockTag"})
    @Override
    public void onCreate() {
        super.onCreate();

        //sendAlerts();

        //numbers = new ArrayList<>();
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.UK);

        createChannels();

        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);

        if (pm != null) {
            wl = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "My Tag");
            wl.acquire();
        }

        if (sensorManager != null) {
            pulseSensor = sensorManager.getDefaultSensor(Sensor.TYPE_HEART_RATE);
            accelerometerSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
            Sensor stepsSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
            sensorManager.registerListener(MainService.this, stepsSensor, SensorManager.SENSOR_DELAY_NORMAL);
        }

        locationManager = (LocationManager) this.getSystemService(Context.LOCATION_SERVICE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification.Builder builder = new Notification.Builder(this, Constants.ANDROID_CHANNEL_ID).setContentTitle(getString(R.string.app_name)).setContentText("Running in background!").setAutoCancel(true);

        startForeground(1, builder.build());

        if (getDefaults(MainService.this) == null) {
            TelephonyManager c = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                if (c != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        IMEI = c.getImei();
                        setDefaults(IMEI, MainService.this);
                    }
                }
            }
        } else {
            IMEI = getDefaults(MainService.this);
        }

        if (IMEI != null) {
            new ConfigAppTask(this).execute(Constants.CONFIG_URL + IMEI);
        } else {
            Toast.makeText(this, "Can't find IMEI", Toast.LENGTH_SHORT).show();
        }

        registerReceiver(dataReceiver, new IntentFilter(Constants.BROADCAST_DATA));
        registerReceiver(chargerReceiver, new IntentFilter(Intent.ACTION_POWER_CONNECTED));
        registerReceiver(chargerReceiver, new IntentFilter(Intent.ACTION_POWER_DISCONNECTED));

        return super.onStartCommand(intent, flags, startId);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();

        cancelTimers();

        unregisterReceiver(dataReceiver);
        unregisterReceiver(chargerReceiver);

        wl.release();
    }

    private void initDataTimer() {
        if (dataTimer != null) {
            dataTimer.cancel();
            dataTimer = null;
        }

        dataTimer = new Timer();
        dataHandler = new Handler();
    }

    private void initPulseTimer() {
        if (pulseTimer != null) {
            pulseTimer.cancel();
            pulseTimer = null;
        }

        pulseTimer = new Timer();
        pulseHandler = new Handler();
    }

    private void initLocationTimer() {
        if (locationTimer != null) {
            locationTimer.cancel();
            locationTimer = null;
        }

        locationTimer = new Timer();
        locationHandler = new Handler();
    }

    private void cancelTimers() {
        if (dataTimer != null) {
            dataTimer.cancel();
            dataTimer = null;
        }

        if (pulseTimer != null) {
            pulseTimer.cancel();
            pulseTimer = null;
        }

        if (locationTimer != null) {
            locationTimer.cancel();
            locationTimer = null;
        }
    }


    public void createChannels() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel androidChannel = new NotificationChannel(Constants.ANDROID_CHANNEL_ID, Constants.ANDROID_CHANNEL_NAME, NotificationManager.IMPORTANCE_HIGH);
            androidChannel.enableLights(true);
            androidChannel.enableVibration(true);
            androidChannel.setLightColor(Color.GREEN);
            androidChannel.setLockscreenVisibility(Notification.VISIBILITY_PRIVATE);

            getManager().createNotificationChannel(androidChannel);
        }
    }

    private NotificationManager getManager() {
        if (notificationManager == null) {
            notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        }
        return notificationManager;
    }

    public Notification.Builder getAndroidChannelNotification(String title, String body) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return new Notification.Builder(getApplicationContext(), Constants.ANDROID_CHANNEL_ID)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setSmallIcon(R.mipmap.icon_box)
                    .setAutoCancel(true);
        }
        return null;
    }

    private void getPulse() {
        sensorManager.registerListener(MainService.this, pulseSensor, SensorManager.SENSOR_DELAY_NORMAL);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        switch (event.sensor.getType()) {
            case Sensor.TYPE_HEART_RATE:
                pulseSensor(event.values[0], event.accuracy);
                break;
            case Sensor.TYPE_STEP_COUNTER:
                stepsSensor(event.values[0]);
                break;
            case Sensor.TYPE_ACCELEROMETER:
                accelerometerSensor(event.values[0], event.values[1], event.values[2]);
                break;
        }
    }

    private void pulseSensor(float value, int accuracy) {
        if (accuracy >= 0) {
            pulse = value;
        } else {
            pulse = -1;
        }
        publishPulse();
    }

    private void stepsSensor(float value) {
        steps = value;
        publishSteps();
    }

    private void accelerometerSensor(float x, float y, float z) {
        contorValAcc++;

        float mAccelLast = mAccelCurrent;
        mAccelCurrent = (float) Math.sqrt(x * x + y * y + z * z);
        float delta = mAccelCurrent - mAccelLast;
        mAccel = mAccel * 0.9f + delta;

        if (mAccel > 3 && contorValAcc >= 15) {
            contorValAcc = 0;
            sensorManager.unregisterListener(MainService.this, accelerometerSensor);
            onGetLoc();
            onGetPulse();
            onSaveData();
            onSendData();
        }
    }

    public void publishPulse() {
        sendBroadcast(new Intent(Constants.BROADCAST_PULSE).putExtra("pulse", pulse));
    }

    public void publishSteps() {
        sendBroadcast(new Intent(Constants.BROADCAST_STEPS).putExtra("steps", steps - auxSteps));
    }

    private void writeFile() {
        Log.e(MainService.class.getSimpleName(), "Save data");

        Log.d("MainService", "writeFile: " + latitude + ":" + longitude);

        String[] safe = Database.getInstance(this).getDb().getSafeZone();

        if (gps) {
            Database.getInstance(this).getDb().updateSafeZone(safe[0], "" + latitude, "" + longitude);
            if (Storage.getInstance().getGeofacing()) {
                if (!Storage.getInstance().getGeofancing().contains(new Punct(latitude, longitude))) {
                    Notification.Builder nb = getAndroidChannelNotification("Alerta!", "Ati iesit din zona permisa!");
                    getManager().notify(Constants.GEOFANCING_NOTIFICATION_ID, nb.build());
                }
            }

            if (Storage.getInstance().getDistance()) {
                if (Math.sqrt((Math.pow(latitude - Storage.getInstance().getDistancePoint().getX(), 2) + Math.pow(longitude - Storage.getInstance().getDistancePoint().getY(), 2))) > Storage.getInstance().getRaza()) {
                    Notification.Builder nb = getAndroidChannelNotification("Alerta!", "Ati iesit din zona permisa!");
                    getManager().notify(Constants.GEOFANCING_NOTIFICATION_ID, nb.build());
                }
            }

            new AlertTask(this).execute(Constants.NEW_ALERT_URL, IMEI, "POINT(" + longitude + " " + latitude + ")", alertaZona, "0");
            // efectuare apel...
        }

        JSONObject obj = new JSONObject();
        try {

            safe = Database.getInstance(this).getDb().getSafeZone();

            JSONObject geo = new JSONObject().put("latitude", safe[1]).put("longitude", safe[2]);

            obj.put("imei", IMEI)
                    .put("dateTimeISO", dateFormat.format(new Date()))
                    .put("geolocation", geo).put("lastLocation", gps)
                    .put("sendPanicAlerts", sendPanicAlerts)
                    .put("stepCounter", steps - auxSteps)
                    .put("bloodPressureSystolic", "")
                    .put("bloodPressureDiastoloc", "")
                    .put("bloodPressurePulseRate", (int) pulse)
                    .put("bloodGlucose", "")
                    .put("oxygenSaturation", "")
                    .put("extension", "")
                    .put("idClient", Storage.getInstance().getConfig().idClient);

            // trebe sters
            Notification.Builder nb = getAndroidChannelNotification("Valori masurare!", "IMEI: " + IMEI + ", Data: " + dateFormat.format(new Date()) + ", Puls: " + pulse + ", Pasi: " + (steps - auxSteps) + ", Lat: " + safe[1] + ", Long: " + safe[2] + ", GPS: " + gps);
            getManager().notify(12345, nb.build());

            gps = false;
            sendPanicAlerts = false;

        } catch (Exception e) {
            e.printStackTrace();
            return;
        }
        auxSteps = steps;
        pulse = -1;

        Database.getInstance(this).getDb().insert(DatabaseHelper.TABLE_MEASUREMENTS, obj.toString());
    }

    private void batteryLevel() {
        BroadcastReceiver batteryLevelReceiver = new BroadcastReceiver() {
            public void onReceive(Context context, Intent intent) {
                context.unregisterReceiver(this);
                int rawLevel = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                int level = -1;
                if (rawLevel >= 0 && scale > 0) {
                    level = (rawLevel * 100) / scale;
                }

                if (level <= 20) {
                    Notification.Builder nb = getAndroidChannelNotification("Nivel baterie scazut!", level + "%");
                    getManager().notify(Constants.BATTERY_LEVEL_NOTIFICATION_ID, nb.build());
                }
            }
        };
        IntentFilter batteryLevelFilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        registerReceiver(batteryLevelReceiver, batteryLevelFilter);
    }

    private void setDefaults(String value, Context context) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString("imei", value);
        editor.apply();
    }

    private String getDefaults(Context context) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        return preferences.getString("imei", null);
    }

    @Override
    public Notification.Builder onGetAndroidChannelNotification(String title, String body) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            return new Notification.Builder(getApplicationContext(), Constants.ANDROID_CHANNEL_ID)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setSmallIcon(android.R.drawable.stat_notify_more)
                    .setAutoCancel(true);
        }
        return null;
    }

    @Override
    public NotificationManager onGetManager() {
        if (notificationManager == null) {
            notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        }
        return notificationManager;
    }

    @Override
    public void onGetLoc() {
        Database.getInstance(this).getDb().setSafeZone("" + Storage.getInstance().getConfig().safeLatitude, "" + Storage.getInstance().getConfig().safeLongitude);
        initLocationTimer();

        locationTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                locationHandler.post(() -> {
                    if (ActivityCompat.checkSelfPermission(MainService.this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, MainService.this);
                    }
                });
            }
        }, 0, TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().locInt));
    }

    @Override
    public void onGetPulse() {
        initPulseTimer();

        pulseTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                pulseHandler.post(() -> getPulse());
            }
        }, 0, TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().pulseInt));
    }

    @Override
    public void saveSafeZone(String latitudine, String longitudine) {
        Database.getInstance(this).getDb().setSafeZone(latitudine, longitudine);
    }

    public void onSaveData() {
        if (writeTimer != null) {
            writeTimer.cancel();
            writeTimer = null;
        }

        writeTimer = new Timer();
        writeHandler = new Handler();
        writeTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                writeHandler.post(() -> {
                    locationManager.removeUpdates(MainService.this);
                    sensorManager.unregisterListener(MainService.this, pulseSensor);
                    batteryLevel();
                    if (pulse >= 0) {

                        if (pulse < Storage.getInstance().getConfig().valMinPulse) {
                            Notification.Builder nb = getAndroidChannelNotification("Puls", "Aveti pulsul prea mic! (" + pulse + " bpm)");
                            getManager().notify(Constants.PULSE_NOTIFICATION_ID, nb.build());
                            sendPanicAlerts = true;
                            new AlertTask(MainService.this).execute(Constants.NEW_ALERT_URL, IMEI, "POINT(" + longitude + " " + latitude + ")", alertaPuls, "" + pulse);
                        }
                        if (pulse > Storage.getInstance().getConfig().valMaxPulse) {
                            Notification.Builder nb = getAndroidChannelNotification("Puls", "Aveti pulsul prea mare! (" + pulse + " bpm)");
                            getManager().notify(Constants.PULSE_NOTIFICATION_ID, nb.build());
                            sendPanicAlerts = true;
                            new AlertTask(MainService.this).execute(Constants.NEW_ALERT_URL, IMEI, "POINT(" + longitude + " " + latitude + ")", alertaPuls, "" + pulse);
                        }

                        writeFile();
                    } else {
                        cancelTimers();
                        sensorManager.registerListener(MainService.this, accelerometerSensor, SensorManager.SENSOR_DELAY_NORMAL);
                    }
                });
            }
        }, 45000, TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().pulseInt));
    }

    @Override
    public void onSendDataDone(ArrayList<String> ids) {
        ids.forEach(e -> Database.getInstance(MainService.this).getDb().delete(DatabaseHelper.TABLE_MEASUREMENTS, e));
    }

    @Override
    public void onSendData() {
        initDataTimer();

        dataTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                dataHandler.post(() -> sendData());
            }
        }, TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().dataInt), TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().dataInt));
    }

    private void sendData() {
        ArrayList<String> ids = new ArrayList<>();
        JSONArray data = new JSONArray();

        Cursor c = Database.getInstance(this).getDb().getData(DatabaseHelper.TABLE_MEASUREMENTS);

        while (c.moveToNext()) {
            ids.add(c.getString(0));
            try {
                data.put(new JSONObject(c.getString(1)));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        Log.e(MainService.class.getSimpleName(), data.toString());

        new SendDataTask(this, ids).execute(Constants.DATA_URL, data.toString());
    }

    private void sendAlerts() {
        ArrayList<String> ids = new ArrayList<>();
        JSONArray data = new JSONArray();

        Cursor c = Database.getInstance(this).getDb().getData(DatabaseHelper.TABLE_ALERTS);

        while (c.moveToNext()) {
            ids.add(c.getString(0));
            try {
                data.put(new JSONObject(c.getString(1)));
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        new MissedAlerts(this, ids).execute(data.toString());
    }

    @Override
    public void onNotify(String res) {
        Notification.Builder nb = getAndroidChannelNotification("Config!", res == null ? "Nu s-a putut realiza conexiunea la server" : res);
        getManager().notify(Constants.RES_CONFIG_DATA, nb.build());
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onLocationChanged(Location location) {
        if (location != null) {
            longitude = location.getLongitude();
            latitude = location.getLatitude();
            gps = true;
        }
    }

    @Override
    public void onStatusChanged(String s, int i, Bundle bundle) {

    }

    @Override
    public void onProviderEnabled(String s) {

    }

    @Override
    public void onProviderDisabled(String s) {

    }

    @Override
    public void onAlertError(JSONObject alert) {
        Database.getInstance(this).getDb().insert(DatabaseHelper.TABLE_ALERTS, alert.toString());
    }

    @Override
    public void clearData(ArrayList<String> ids) {
        ids.forEach(e -> Database.getInstance(MainService.this).getDb().delete(DatabaseHelper.TABLE_ALERTS, e));

    }
}
