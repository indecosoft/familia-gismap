package com.example.ovidiupodina.emotion.tasks.alerts;

import android.app.Notification;
import android.os.AsyncTask;
import android.util.Log;

import com.example.ovidiupodina.emotion.database.Constants;
import com.example.ovidiupodina.emotion.data.Storage;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

import javax.net.ssl.HttpsURLConnection;

public class AlertTask extends AsyncTask<String, Void, String> {

    private IAlertTask iAlertTask;

    private String tipAlerta = "";

    private JSONObject alert = new JSONObject();

    public AlertTask(IAlertTask iAlertTask) {
        this.iAlertTask = iAlertTask;
    }

    @Override
    protected String doInBackground(String... strings) {
        this.tipAlerta = strings[3];

        try {

            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.UK);

            if (strings[1] != null && strings[2] != null && strings[3] != null && strings[4] != null) {
                alert.put("imei", strings[1]);
                alert.put("coordonate", strings[2]);
                alert.put("tipAlerta", tipAlerta);
                alert.put("valoare", strings[4]);
                alert.put("idClient", Storage.getInstance().getConfig().idClient);
                alert.put("dateTime", dateFormat.format(new Date()));
                alert.put("idPersAsisoc", Storage.getInstance().getConfig().idPersAsisoc);
            }


            HttpURLConnection connection = (HttpURLConnection) new URL(strings[0]).openConnection();
            connection.setReadTimeout(1500);
            connection.setConnectTimeout(1500);
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoInput(true);
            connection.setDoOutput(true);

            OutputStream os = connection.getOutputStream();
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(os, StandardCharsets.UTF_8));

            writer.write(alert.toString());

            writer.flush();
            writer.close();
            os.close();

            if (connection.getResponseCode() == HttpsURLConnection.HTTP_OK) {
                BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = in.readLine()) != null) {
                    sb.append(line);
                }
                in.close();
                connection.disconnect();
                return sb.toString();
            }

        } catch (IOException | JSONException e) {
            e.printStackTrace();
            return null;
        }

        return null;
    }

    @Override
    protected void onPostExecute(String res) {
        super.onPostExecute(res);

        String body;

        if (res != null) {
            body = res;
        } else {
            body = "Nu s-a putut realiza conexiunea la server!";
            Log.e("AlertTask", "" + alert);
            iAlertTask.onAlertError(alert);
        }

        Notification.Builder nb = iAlertTask.onGetAndroidChannelNotification(this.tipAlerta, body);
        iAlertTask.onGetManager().notify(Constants.RES_SEND_DATA, nb.build());
    }
}
