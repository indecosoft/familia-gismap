package com.example.ovidiupodina.emotion.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

import com.example.ovidiupodina.emotion.services.MainService;

public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();

        if (action != null && action.equals(Intent.ACTION_BOOT_COMPLETED)) {
            context.startForegroundService(new Intent(context, MainService.class));
        }
    }
}
