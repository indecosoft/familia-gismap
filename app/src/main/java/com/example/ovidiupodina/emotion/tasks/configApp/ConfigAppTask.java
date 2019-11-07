package com.example.ovidiupodina.emotion.tasks.configApp;

import android.os.AsyncTask;

import com.example.ovidiupodina.emotion.data.Storage;
import com.example.ovidiupodina.emotion.geofacing.Punct;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class ConfigAppTask extends AsyncTask<String, Void, String> {

    private HttpURLConnection connection;
    private IConfigApp iConfigApp;

    public ConfigAppTask(IConfigApp iConfigApp) {
        this.iConfigApp = iConfigApp;
    }

    @Override
    protected String doInBackground(String... strings) {
        try {
            connection = (HttpURLConnection) new URL(strings[0]).openConnection();
            connection.setReadTimeout(15000);
            connection.setConnectTimeout(15000);
            connection.setRequestMethod("GET");

            if (connection.getResponseCode() == HttpURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    sb.append(line);
                }
                in.close();

                return sb.toString();
            }
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }

        return null;
    }

    @Override
    protected void onPostExecute(String res) {
        super.onPostExecute(res);

        if (res != null) {
            try {
                JSONObject object = new JSONObject(res);
                JSONObject pulseObject = (JSONObject) object.get("bloodPressurePulseRate");

                Storage.getInstance().setConfig(object.getInt("dataSendInterval"), object.getInt("idClient"), pulseObject.getInt("interval"), object.getInt("locationSendInterval"), pulseObject.getInt("maxValue"), pulseObject.getInt("minValue"), object.getInt("idPersoana"));

               //String alert = object.getString("panicPhoneNumbers");

                String safeArea = object.getString("geolocationSafeArea");

                if (safeArea != null) {

                    Storage.getInstance().setGeofacing(true);
                    Storage.getInstance().setDistance(false);

                    String[] points = safeArea.split(",");

                    for (String p : points) {
                        String[] point = p.split(" ");
                        if (point.length > 1) {
                            Storage.getInstance().getGeofancing().addNewPoint(new Punct(Double.parseDouble(point[1]), Double.parseDouble(point[0])));
                        }
                    }
                } else {

                    Storage.getInstance().setGeofacing(false);
                    Storage.getInstance().setDistance(true);

                    JSONObject safeDistance = object.getJSONObject("geolocationSafeDistance");

                    if (safeDistance != null) {
                        Storage.getInstance().setDistancePoint(new Punct(safeDistance.getDouble("latitude"), safeDistance.getDouble("longitude")));
                        Storage.getInstance().setRaza(safeDistance.getInt("maxValue"));
                    }
                }

            } catch (JSONException e) {
                e.printStackTrace();
            }
        }

        iConfigApp.onGetLoc();
        iConfigApp.onGetPulse();
        iConfigApp.onWriteFile();
        iConfigApp.onSendData();
        iConfigApp.onNotify(res);
    }
}
