package com.example.ovidiupodina.emotion.activities;

import android.Manifest;
import android.app.ActivityManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.wearable.activity.WearableActivity;
import android.widget.TextView;

import com.example.ovidiupodina.emotion.database.Constants;
import com.example.ovidiupodina.emotion.services.MainService;
import com.example.ovidiupodina.emotion.R;

public class MainActivity extends WearableActivity {

    private TextView pulseTV;
    private TextView stepsTV;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        initUI();
        checkPermissions();

        setAmbientEnabled();
    }

    private void initUI() {
        pulseTV = findViewById(R.id.pulseTV);
        stepsTV = findViewById(R.id.stepsTV);
    }

    private void checkPermissions() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.BODY_SENSORS) == PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(this, Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED) {
            if (isMyServiceRunning()) {
                startForegroundService(new Intent(MainActivity.this, MainService.class));
            }
        } else {
            ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.BODY_SENSORS, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.READ_PHONE_STATE, Manifest.permission.SEND_SMS}, Constants.PERMISSION_REQUEST_CODE);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        registerReceiver(pulseRcv, new IntentFilter(Constants.BROADCAST_PULSE));
        registerReceiver(stepsRcv, new IntentFilter(Constants.BROADCAST_STEPS));

        sendBroadcast(new Intent(Constants.BROADCAST_DATA).putExtra("data", true));
    }

    @Override
    protected void onPause() {
        super.onPause();
        unregisterReceiver(pulseRcv);
        unregisterReceiver(stepsRcv);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == Constants.PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0) {
                boolean BODY_SENSORS = grantResults[0] == PackageManager.PERMISSION_GRANTED;
                boolean ACCESS_FINE_LOCATION = grantResults[1] == PackageManager.PERMISSION_GRANTED;
                boolean READ_PHONE_STATE = grantResults[2] == PackageManager.PERMISSION_GRANTED;
                boolean SEND_SMS = grantResults[3] == PackageManager.PERMISSION_GRANTED;

                if (BODY_SENSORS && ACCESS_FINE_LOCATION && READ_PHONE_STATE && SEND_SMS) {
                    if (isMyServiceRunning()) {
                        startForegroundService(new Intent(MainActivity.this, MainService.class));
                    }
                } else {
                    ActivityCompat.requestPermissions(
                            MainActivity.this,
                            new String[]{Manifest.permission.BODY_SENSORS, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.READ_PHONE_STATE, Manifest.permission.SEND_SMS},
                            Constants.PERMISSION_REQUEST_CODE
                    );
                }
            }
        }
    }

    private boolean isMyServiceRunning() {
        ActivityManager manager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        if (manager != null) {
            for (ActivityManager.RunningServiceInfo service : manager.getRunningServices(Integer.MAX_VALUE)) {
                if (MainService.class.getName().equals(service.service.getClassName())) {
                    return false;
                }
            }
        }
        return true;
    }

    private BroadcastReceiver pulseRcv = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                String p = getString(R.string.pulse_tv) + " " + bundle.getFloat("pulse");
                pulseTV.setText(p);
            }
        }
    };

    private BroadcastReceiver stepsRcv = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                String s = getString(R.string.steps_tv) + " " + bundle.getFloat("steps");
                stepsTV.setText(s);
            }
        }
    };

}
