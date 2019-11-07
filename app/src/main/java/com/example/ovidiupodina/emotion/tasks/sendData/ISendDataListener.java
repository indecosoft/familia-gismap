package com.example.ovidiupodina.emotion.tasks.sendData;

import android.app.Notification;
import android.app.NotificationManager;

public interface ISendDataListener {
    String onReadFile();
    void onClearFile();
    void onWriteFile(String data);
    Notification.Builder onGetAndroidChannelNotification(String title, String body);
    NotificationManager onGetManager();
}
