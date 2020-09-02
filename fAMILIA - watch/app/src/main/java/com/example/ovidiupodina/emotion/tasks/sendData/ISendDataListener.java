package com.example.ovidiupodina.emotion.tasks.sendData;

import android.app.Notification;
import android.app.NotificationManager;

import java.util.ArrayList;

public interface ISendDataListener {
    void onSendDataDone(ArrayList<String> ids);
    Notification.Builder onGetAndroidChannelNotification(String title, String body);
    NotificationManager onGetManager();
}
