package com.example.familiacall.activities;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.support.wearable.activity.WearableActivity;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.preference.PreferenceManager;

import com.example.familiacall.R;
import com.example.familiacall.tasks.Config;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends WearableActivity implements Config.IConfig {

    private TextView phoneTV;

    private int PERMISSION_REQUEST_CODE = 100;

    private enum keys {IMEI, PHONE}

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        phoneTV = findViewById(R.id.tv_phone);
    }

    @Override
    protected void onStart() {
        super.onStart();
        start();
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0) {
                boolean CALL = grantResults[0] == PackageManager.PERMISSION_GRANTED;
                boolean STATE = grantResults[1] == PackageManager.PERMISSION_GRANTED;

                if (CALL && STATE) {
                    start();
                } else {
                    requestPermission();
                }
            }
        }
    }

    @Override
    public void onResponse(String res) {

        if (res == null) {
            return;
        }

        try {
            JSONObject obj = new JSONObject(res);

            JSONArray nr = obj.getJSONArray("panicPhoneNumbers");

            if (nr.length() <= 0) {
                return;
            }

            setDefaults(this, keys.PHONE.toString(), nr.getString(0));
            start();

        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    private void setDefaults(Context context, String key, String value) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString(key, value);
        editor.apply();
    }

    private String getDefaults(Context context, String key) {
        SharedPreferences preferences = PreferenceManager.getDefaultSharedPreferences(context);
        return preferences.getString(key, null);
    }

    public void call(@NonNull String phone) {
        Intent call = new Intent(Intent.ACTION_CALL);

        call.setData(Uri.parse("tel:" + phone));

        if (ActivityCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CALL_PHONE) != PackageManager.PERMISSION_GRANTED) {
            requestPermission();
            return;
        }

        startActivity(call);
    }

    private boolean checkPermission() {
        return (ActivityCompat.checkSelfPermission(this, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED) && (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED);
    }

    private void requestPermission() {
        ActivityCompat.requestPermissions(
                MainActivity.this,
                new String[]{Manifest.permission.CALL_PHONE, Manifest.permission.READ_PHONE_STATE},
                PERMISSION_REQUEST_CODE
        );
    }

    public void getConfig(@NonNull String imei) {
        new Config(this).execute("https://gisdev.indecosoft.net/chat/api/get-device-config/" + imei);
    }

    public void getImei() {
        TelephonyManager c = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            if (c != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Log.e("IMEI", c.getImei());
                    setDefaults(this, keys.IMEI.toString(), c.getImei());
                }
            }
        }
    }

    private void start() {
        if (!checkPermission()) {
            requestPermission();
        } else {
            String phone = getDefaults(this, keys.PHONE.toString());

            if (phone != null) {
                phoneTV.setText(phone);
                call(phone);
            } else {
                String imei = getDefaults(this, keys.IMEI.toString());

                if (imei != null) {
                    getConfig(imei);
                } else {
                    getImei();
                    getConfig(getDefaults(this, keys.IMEI.toString()));
                }
            }
        }
    }

}
