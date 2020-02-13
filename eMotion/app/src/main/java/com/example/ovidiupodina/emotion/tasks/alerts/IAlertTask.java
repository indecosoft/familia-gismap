package com.example.ovidiupodina.emotion.tasks.alerts;

import android.app.Notification;
import android.app.NotificationManager;

import org.json.JSONObject;

public interface IAlertTask {
    Notification.Builder onGetAndroidChannelNotification(String title, String body);
    NotificationManager onGetManager();
    void onAlertError(JSONObject alert);
}
