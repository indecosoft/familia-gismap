package com.example.ovidiupodina.emotion;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.widget.Toast;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (action != null && action.equals(Intent.ACTION_BOOT_COMPLETED)) {
            Toast.makeText(context, "Boot completed!", Toast.LENGTH_SHORT).show();
            context.startForegroundService(new Intent(context, MainService.class));
        }
    }
}
