package com.example.familiaqr;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.support.wearable.activity.WearableActivity;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.widget.ImageView;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.google.zxing.WriterException;

import androidmads.library.qrgenearator.QRGContents;
import androidmads.library.qrgenearator.QRGEncoder;

public class MainActivity extends WearableActivity {

    private ImageView qrImage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        qrImage = findViewById(R.id.iv_qr_code);
        checkPermissions();
    }


    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == 1) {
            if (grantResults.length > 0) {
                boolean READ_PHONE_STATE = grantResults[0] == PackageManager.PERMISSION_GRANTED;

                if (!READ_PHONE_STATE) {
                    ActivityCompat.requestPermissions(
                            MainActivity.this,
                            new String[]{Manifest.permission.BODY_SENSORS, Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.READ_PHONE_STATE, Manifest.permission.SEND_SMS},
                            1
                    );
                } else {
                    showQR(getImei());
                }
            }
        }
    }

    private String getImei() {
        TelephonyManager c = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            if (c != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    return c.getImei();
                }
            }
        }

        return null;
    }

    private void checkPermissions() {
        if ( ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.READ_PHONE_STATE}, 1);
        } else {
            showQR(getImei());
        }
    }


    private void showQR(String imei) {
        try {
            QRGEncoder qrgEncoder = new QRGEncoder(imei, null, QRGContents.Type.TEXT, 2000);
            Bitmap bitmap = qrgEncoder.encodeAsBitmap();
            qrImage.setImageBitmap(bitmap);
        } catch (WriterException e) {
            Log.v("MainActivity", e.toString());
        }
    }

}
