package com.example.ovidiupodina.emotion;

public class Config {
    public int dataInt;
    public int idClient;
    public int idPersAsisoc;
    public int pulseInt;
    public int locInt;
    public int valMaxPulse;
    public int valMinPulse;

    public Config() {
        pulseInt = 5;
        locInt = 5;
        dataInt = 30;
        valMinPulse = 60;
        valMaxPulse = 130;
        idClient = 0;
        idPersAsisoc = 0;
    }
}
