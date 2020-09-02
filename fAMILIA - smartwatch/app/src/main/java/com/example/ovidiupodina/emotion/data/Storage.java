package com.example.ovidiupodina.emotion.data;

import com.example.ovidiupodina.emotion.models.Config;
import com.example.ovidiupodina.emotion.geofacing.Geofancing;
import com.example.ovidiupodina.emotion.geofacing.Punct;

public class Storage {

    private volatile static Storage instance;
    private Config config;
    private Geofancing geofancing;
    private Punct distancePoint;
    private boolean distance;
    private boolean geofacing;
    private int raza;

    private Storage() {
        config = new Config();
        geofancing = new Geofancing();
        config.pulseInt = 5;
        config.locInt = 5;
        config.dataInt = 30;
    }

    public static Storage getInstance() {
        Storage result = instance;
        if (result == null) {
            synchronized (Storage.class) {
                result = instance;
                if (result == null) {
                    instance = result = new Storage();
                }
            }
        }
        return result;
    }

    public Config getConfig() {
        return config;
    }

    public void setConfig(int dataInt, int idClient, int pulseInt, int locInt, int valMaxPulse, int valMinPulse, int idPersAsisoc, double safeLatitude, double safeLongitude) {
        config.dataInt = dataInt;
        config.idClient = idClient;
        config.pulseInt = pulseInt;
        config.locInt = locInt;
        config.valMaxPulse = valMaxPulse;
        config.valMinPulse = valMinPulse;
        config.idPersAsisoc = idPersAsisoc;
        config.safeLatitude = safeLatitude;
        config.safeLongitude = safeLongitude;
    }

    public Geofancing getGeofancing() {
        return geofancing;
    }

    public boolean getDistance() {
        return distance;
    }

    public void setDistance(boolean distance) {
        this.distance = distance;
    }

    public boolean getGeofacing() {
        return geofacing;
    }

    public void setGeofacing(boolean geofacing) {
        this.geofacing = geofacing;
    }

    public Punct getDistancePoint() {
        return distancePoint;
    }

    public void setDistancePoint(Punct distancePoint) {
        this.distancePoint = distancePoint;
    }

    public int getRaza() {
        return raza;
    }

    public void setRaza(int raza) {
        this.raza = raza;
    }

}
