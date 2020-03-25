package com.example.ovidiupodina.emotion.tasks.configApp;

public interface IConfigApp {
    void saveSafeZone(String latitudine, String longitudine);
    void onSaveData();
    void onGetLoc();
    void onGetPulse();
    void onSendData();
}
