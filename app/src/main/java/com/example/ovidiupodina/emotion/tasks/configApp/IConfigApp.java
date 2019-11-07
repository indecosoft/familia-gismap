package com.example.ovidiupodina.emotion.tasks.configApp;

public interface IConfigApp {
    void onGetLoc();
    void onGetPulse();
    void onWriteFile();
    void onSendData();
    void onNotify(String res);
}
