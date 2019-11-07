package com.example.ovidiupodina.emotion;

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

import com.example.ovidiupodina.emotion.data.Storage;
import com.example.ovidiupodina.emotion.geofacing.Punct;
import com.example.ovidiupodina.emotion.tasks.alerts.AlertTask;
import com.example.ovidiupodina.emotion.tasks.alerts.IAlertTask;
import com.example.ovidiupodina.emotion.tasks.configApp.ConfigAppTask;
import com.example.ovidiupodina.emotion.tasks.configApp.IConfigApp;
import com.example.ovidiupodina.emotion.tasks.sendData.SendDataTask;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.TimeUnit;

import com.example.ovidiupodina.emotion.tasks.sendData.ISendDataListener;

import static com.example.ovidiupodina.emotion.Constants.alertaPuls;
import static com.example.ovidiupodina.emotion.Constants.alertaZona;

public class MainService extends Service implements SensorEventListener, ISendDataListener, IConfigApp, IAlertTask {

    private Sensor pulseSensor;
    private Sensor accelerometerSensor;

    private SensorManager sensorManager;

    private LocationManager locationManager;
    private LocationListener locationListener;

    private int contorValAcc = 0;

    private float pulse;
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

        //new SendDataTask(this).execute(Constants.DATA_URL);

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
        locationListener = new LocationListener() {
            @Override
            public void onLocationChanged(Location location) {
                if (location != null) {
                    longitude = location.getLongitude();
                    latitude = location.getLatitude();
                    gps = true;
                }
            }

            @Override
            public void onStatusChanged(String provider, int status, Bundle extras) {

            }

            @Override
            public void onProviderEnabled(String provider) {

            }

            @Override
            public void onProviderDisabled(String provider) {

            }
        };
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Notification.Builder builder = new Notification.Builder(this, Constants.ANDROID_CHANNEL_ID).setContentTitle(getString(R.string.app_name)).setContentText("Running in background!").setAutoCancel(true);

        startForeground(1, builder.build());

        if (getDefaults("imei", MainService.this) == null) {
            TelephonyManager c = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
            if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                if (c != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        IMEI = c.getImei();
                        setDefaults("imei", IMEI, MainService.this);
                    }
                }
            }
        } else {
            IMEI = getDefaults("imei", MainService.this);
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

        Log.w("Accel", "" + mAccel);

        if (mAccel > 3 && contorValAcc >= 15) {
            contorValAcc = 0;
            sensorManager.unregisterListener(MainService.this, accelerometerSensor);
            onGetLoc();
            onGetPulse();
            onWriteFile();
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
        if (gps) {
            if (Storage.getInstance().getGeofacing()) {
                if (!Storage.getInstance().getGeofancing().contains(new Punct(latitude, longitude))) {
                    Notification.Builder nb = getAndroidChannelNotification("Alerta!", "Ati iesit din zona permisa!");
                    getManager().notify(Constants.GEOFANCING_NOTFICATION_ID, nb.build());
                }
            }

            if (Storage.getInstance().getDistance()) {
                if (Math.sqrt((Math.pow(latitude - Storage.getInstance().getDistancePoint().getX(), 2) + Math.pow(longitude - Storage.getInstance().getDistancePoint().getY(), 2))) > Storage.getInstance().getRaza()) {
                    Notification.Builder nb = getAndroidChannelNotification("Alerta!", "Ati iesit din zona permisa!");
                    getManager().notify(Constants.GEOFANCING_NOTFICATION_ID, nb.build());
                }
            }
            new AlertTask(this).execute(Constants.NEW_ALERT_URL, IMEI, "POINT(" + longitude + " " + latitude + ")", alertaZona, "0");
            //new SendAlert().execute(Constants.ALERT_URL);
            //efectuare apel...
        }


        JSONObject obj = new JSONObject();
        try {
            if (gps) {
                setDefaults("latitudine", "" + latitude, MainService.this);
                setDefaults("longitudine", "" + longitude, MainService.this);
            }

            JSONObject geo = new JSONObject().put("latitude", getDefaults("latitudine", MainService.this)).put("longitude", getDefaults("longitudine", MainService.this));

            obj.put("imei", IMEI).put("dateTimeISO", dateFormat.format(new Date())).put("geolocation", geo).put("lastLocation", gps).put("sendPanicAlerts", sendPanicAlerts).put("stepCounter", steps - auxSteps).put("bloodPressureSystolic", "").put("bloodPressureDiastoloc", "").put("bloodPressurePulseRate", pulse).put("bloodGlucose", "").put("oxygenSaturation", "").put("extension", "").put("idClient", Storage.getInstance().getConfig().idClient);

            // trebe sters
            Notification.Builder nb = getAndroidChannelNotification("Valori masurare!", "IMEI: " + IMEI + ", Data: " + dateFormat.format(new Date()) + ", Puls: " + pulse + ", Pasi: " + (steps - auxSteps) + ", Lat: " + getDefaults("latitudine", MainService.this) + ", Long: " + getDefaults("longitudine", MainService.this) + ", GPS: " + gps);
            getManager().notify(12345, nb.build());

            gps = false;
            sendPanicAlerts = false;

        } catch (Exception e) {
            e.printStackTrace();
            return;
        }
        auxSteps = steps;

        writeFile(obj);
    }

    private void writeFile(JSONObject obj) {
        try {
            Log.e("FILE", "" + obj);
            File file = new File(getApplicationContext().getFilesDir(), Constants.FILE);
            FileWriter fileWriter = new FileWriter(file, true);
            BufferedWriter out = new BufferedWriter(fileWriter);
            out.write(obj.toString() + ";");
            out.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void batteryLevel() {
        BroadcastReceiver batteryLevelReceiver = new BroadcastReceiver() {
            public void onReceive(Context context, Intent intent) {
                context.unregisterReceiver(this);
                int rawlevel = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
                int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
                int level = -1;
                if (rawlevel >= 0 && scale > 0) {
                    level = (rawlevel * 100) / scale;
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

    private void setDefaults(String key, String value, Context context) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(key, value);
        editor.apply();
    }

    private String getDefaults(String key, Context context) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        return preferences.getString(key, null);
    }

    @Override
    public String onReadFile() {
        FileInputStream fis;
        try {
            fis = getApplicationContext().openFileInput(Constants.FILE);
            InputStreamReader isr = new InputStreamReader(fis);
            BufferedReader bufferedReader = new BufferedReader(isr);
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                sb.append(line);
            }
            fis.close();
            return sb.toString();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public void onClearFile() {
        FileOutputStream fileOutputStream;

        try {
            fileOutputStream = openFileOutput(Constants.FILE, Context.MODE_PRIVATE);
            fileOutputStream.write("".getBytes());
            fileOutputStream.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onWriteFile(String data) {
        try {
            File file = new File(getApplicationContext().getFilesDir(), Constants.FILE);
            FileWriter fileWriter = new FileWriter(file, true);
            BufferedWriter out = new BufferedWriter(fileWriter);
            out.write(data);
            out.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
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
        initLocationTimer();

        locationTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                locationHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        if (ActivityCompat.checkSelfPermission(MainService.this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 0, 0, locationListener);
                        }
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
                pulseHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        getPulse();
                    }
                });
            }
        }, 0, TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().pulseInt));
    }

    @Override
    public void onWriteFile() {
        if (writeTimer != null) {
            writeTimer.cancel();
            writeTimer = null;
        }

        writeTimer = new Timer();
        writeHandler = new Handler();
        writeTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                writeHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        locationManager.removeUpdates(locationListener);
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
                    }
                });
            }
        }, 30000, TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().pulseInt));
    }

    @Override
    public void onSendData() {
        initDataTimer();

        dataTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                dataHandler.post(new Runnable() {
                    @Override
                    public void run() {
                        new SendDataTask(MainService.this).execute(Constants.DATA_URL);
                    }
                });
            }
        }, TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().dataInt), TimeUnit.MINUTES.toMillis(Storage.getInstance().getConfig().dataInt));
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

}
